
// Version 2.1.0 - Optimized Native Mobile Camera & Gallery Integration
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { 
  Utensils, 
  IceCream, 
  Leaf, 
  Plus, 
  LogOut, 
  Trash2, 
  Clock, 
  MapPin, 
  User as UserIcon,
  ChevronLeft,
  Sparkles,
  Languages,
  Edit3,
  Loader2,
  Check,
  Cloud,
  Search,
  Camera,
  Image as ImageIcon,
  X,
  Upload
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { TRANSLATIONS } from './constants';
import { Recipe, User, Language } from './types';
import { generateQuickRecipe, translateRecipeContent } from './geminiService';

// Supabase Configuration
const SUPABASE_URL = 'https://rykviuyxoydtaathvmkj.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5a3ZpdXl4b3lkdGFhdGh2bWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjMzODgsImV4cCI6MjA4NDIzOTM4OH0.UxSttN6ZzfTepTetya8yLae4-F4gANk6M_z4mHeyaqE'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Utilities ---

/**
 * Compresses an image file for storage efficiency.
 * Uses URL.createObjectURL for better performance on mobile browsers.
 */
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200; 
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return reject('Canvas context error');
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(objectUrl);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject('Image load error');
    };
  });
};

// --- Shared Components ---

const BackButton: React.FC<{ lang: Language; text: string }> = ({ lang, text }) => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate(-1)} 
      className="flex items-center gap-1 text-stone-500 hover:text-amber-700 mb-6 group transition-colors cursor-pointer"
    >
      <ChevronLeft className={`w-5 h-5 transition-transform ${lang === 'ar' || lang === 'he' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
      <span className="font-medium">{text}</span>
    </button>
  );
};

const Navbar: React.FC<{ 
  lang: Language; 
  setLang: (l: Language) => void;
  user: User | null;
  onLogout: () => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
}> = ({ lang, setLang, user, onLogout, syncStatus }) => {
  const t = TRANSLATIONS[lang];
  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold vintage-header text-amber-900">
          <Utensils className="w-8 h-8 text-amber-700" />
          <span className="hidden xs:inline">{t.title}</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {syncStatus === 'synced' && <span title="Synchronized"><Check className="w-5 h-5 text-emerald-500" /></span>}
            {syncStatus === 'syncing' && <span title="Syncing..."><Loader2 className="w-5 h-5 text-amber-500 animate-spin" /></span>}
            {syncStatus === 'offline' && <span title="Offline"><Cloud className="w-5 h-5 text-stone-300" /></span>}
          </div>

          <button 
            onClick={() => setLang(lang === 'ar' ? 'he' : 'ar')} 
            className="px-3 py-1 bg-stone-100 rounded-full text-sm border border-stone-200 hover:bg-stone-200 transition-colors font-bold"
          >
            {lang === 'ar' ? 'עברית' : 'عربي'}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-stone-600 hidden sm:inline">{user.nickname}</span>
              <button onClick={onLogout} className="p-2 text-stone-400 hover:text-red-600 transition-colors cursor-pointer">
                <LogOut className="w-5 h-5"/>
              </button>
            </div>
          ) : (
            <Link to="/auth/login" className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-bold hover:bg-amber-800 transition-colors">
              {t.login}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const RecipeCard: React.FC<{ 
  recipe: Recipe; 
  lang: Language; 
  onDelete?: (id: string) => void; 
  user?: User | null; 
}> = ({ recipe, lang, onDelete, user }) => {
  const t = TRANSLATIONS[lang];
  const isAdmin = user?.isAdmin;
  const isOwner = user?.id === recipe.userId || user?.nickname === recipe.author;
  const translation = recipe.translations?.[lang];
  const displayTitle = translation?.title || recipe.title;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden group relative hover:shadow-md transition-shadow h-full flex flex-col">
      <Link to={`/recipe/${recipe.id}`} className="flex-1">
        <div className="h-48 overflow-hidden bg-stone-100 relative">
          {recipe.imageUrl ? (
             <img 
               src={recipe.imageUrl} 
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
               alt={displayTitle}
             />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-stone-300">
               <ImageIcon className="w-12 h-12" />
             </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-stone-800 line-clamp-1 text-lg mb-2">{displayTitle}</h3>
          <div className="flex items-center gap-3 text-xs text-stone-400 uppercase tracking-wide">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {translation?.prepTime || recipe.prepTime}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {translation?.city || recipe.city}</span>
          </div>
        </div>
      </Link>
      {(isAdmin || isOwner) && (
        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to={`/edit-recipe/${recipe.id}`} className="p-1.5 bg-amber-600 text-white rounded-full shadow-sm hover:bg-amber-700">
            <Edit3 className="w-3.5 h-3.5"/>
          </Link>
          <button 
            onClick={(e) => { e.preventDefault(); if(window.confirm(t.confirmDelete)) onDelete?.(recipe.id); }} 
            className="p-1.5 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });

  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const fetchRecipes = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const { data, error } = await supabase.from('recipes').select('*');
      if (error) throw error;
      if (data) {
        const cloudRecipes = data.map(item => item.data as Recipe);
        setRecipes(cloudRecipes.sort((a, b) => b.id.localeCompare(a.id)));
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error("Database Fetch Error:", err);
      setSyncStatus('offline');
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
    const channel = supabase
      .channel('public:recipes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
        fetchRecipes();
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [fetchRecipes]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const handleAddRecipe = async (r: Recipe) => {
    setSyncStatus('syncing');
    try {
      const { error } = await supabase.from('recipes').insert({ id: r.id, data: r });
      if (error) throw error;
      setRecipes(prev => [r, ...prev]);
      setSyncStatus('synced');
    } catch (err) {
      console.error("Insert Error:", err);
      setSyncStatus('offline');
    }
  };

  const handleDelete = async (id: string) => {
    setSyncStatus('syncing');
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
      setRecipes(prev => prev.filter(r => r.id !== id));
      setSyncStatus('synced');
    } catch (err) {
      console.error("Delete Error:", err);
      setSyncStatus('offline');
    }
  };

  const handleUpdate = async (r: Recipe) => {
    setSyncStatus('syncing');
    try {
      const { error } = await supabase.from('recipes').update({ data: r }).eq('id', r.id);
      if (error) throw error;
      setRecipes(prev => prev.map(item => item.id === r.id ? r : item));
      setSyncStatus('synced');
    } catch (err) {
      console.error("Update Error:", err);
      setSyncStatus('offline');
    }
  };

  return (
    <HashRouter>
      <div className={`min-h-screen flex flex-col bg-[#f5f0e6] ${lang === 'he' ? 'font-[Heebo]' : 'font-[Vazirmatn]'}`}>
        <Navbar lang={lang} setLang={setLang} user={user} onLogout={() => setUser(null)} syncStatus={syncStatus} />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <Routes>
            <Route path="/" element={<HomeView lang={lang} />} />
            <Route path="/category/:catId" element={<CategoryView recipes={recipes} lang={lang} onDelete={handleDelete} user={user} />} />
            <Route path="/recipe/:id" element={<RecipeDetail recipes={recipes} lang={lang} user={user} onDelete={handleDelete} onUpdate={handleUpdate} />} />
            <Route path="/add-recipe" element={user ? <RecipeForm lang={lang} user={user} title={TRANSLATIONS[lang].addRecipe} onSubmit={handleAddRecipe} /> : <Navigate to="/auth/login" />} />
            <Route path="/edit-recipe/:id" element={<EditView recipes={recipes} lang={lang} user={user} onUpdate={handleUpdate} />} />
            <Route path="/auth/login" element={<Auth lang={lang} onLogin={setUser} />} />
          </Routes>
        </main>
        <footer className="bg-stone-900 text-stone-500 py-12 px-4 text-center">
          <p className="vintage-header text-white text-xl mb-2">QuickCuisine</p>
          <p className="text-xs max-w-xs mx-auto opacity-70 leading-relaxed italic">{TRANSLATIONS[lang].lazySlogan}</p>
        </footer>
      </div>
    </HashRouter>
  );
};

const HomeView: React.FC<{ lang: Language }> = ({ lang }) => (
  <div className="text-center py-12">
    <h1 className="text-4xl sm:text-6xl font-bold vintage-header text-amber-900 mb-6">{TRANSLATIONS[lang].title}</h1>
    <p className="text-xl text-stone-600 italic mb-12 max-w-2xl mx-auto">{TRANSLATIONS[lang].welcome}</p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
      {['main', 'sweets', 'diet'].map(cid => (
        <Link key={cid} to={`/category/${cid}`} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border border-stone-100 flex flex-col items-center group">
          <div className="p-4 bg-amber-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
            {cid === 'main' && <Utensils className="w-10 h-10 text-amber-700"/>}
            {cid === 'sweets' && <IceCream className="w-10 h-10 text-pink-700"/>}
            {cid === 'diet' && <Leaf className="w-10 h-10 text-emerald-700"/>}
          </div>
          <h2 className="text-2xl font-bold vintage-header">{TRANSLATIONS[lang][cid === 'main' ? 'mainDishes' : cid === 'sweets' ? 'sweets' : 'diet']}</h2>
        </Link>
      ))}
    </div>
    <div className="mt-16">
      <Link to="/add-recipe" className="inline-flex items-center gap-2 px-10 py-4 bg-amber-700 text-white rounded-full font-bold shadow-lg hover:scale-105 hover:bg-amber-800 transition-all">
        <Plus className="w-6 h-6"/> {TRANSLATIONS[lang].addRecipe}
      </Link>
    </div>
  </div>
);

const CategoryView = ({ recipes, lang, onDelete, user }: any) => {
  const { catId } = useParams();
  const t = TRANSLATIONS[lang];
  const filtered = recipes.filter((r: any) => r.category === catId);
  return (
    <div>
      <BackButton lang={lang} text={t.back} />
      <h1 className="text-3xl font-bold vintage-header text-amber-900 mb-8">
        {catId === 'main' ? t.mainDishes : catId === 'sweets' ? t.sweets : t.diet}
      </h1>
      {filtered.length === 0 ? (
        <div className="bg-white/50 border-2 border-dashed border-stone-300 rounded-3xl p-20 text-center flex flex-col items-center">
           <Search className="w-12 h-12 text-stone-300 mb-4" />
           <p className="text-stone-500 font-medium mb-6">{t.noRecipes}</p>
           <Link to="/add-recipe" state={{ category: catId }} className="text-amber-700 font-bold hover:underline flex items-center gap-1">
             <Plus className="w-4 h-4"/> {t.addRecipe}
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((r: any) => <RecipeCard key={r.id} recipe={r} lang={lang} onDelete={onDelete} user={user} />)}
          <Link to="/add-recipe" state={{ category: catId }} className="border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center p-8 hover:bg-stone-50 transition-colors group">
            <Plus className="w-10 h-10 text-stone-300 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-stone-400 font-bold">{t.addRecipe}</span>
          </Link>
        </div>
      )}
    </div>
  );
};

const RecipeDetail = ({ recipes, lang, user, onDelete, onUpdate }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = recipes.find((r: any) => r.id === id);
  const t = TRANSLATIONS[lang];
  const [translating, setTranslating] = useState(false);
  
  if (!recipe) return <div className="text-center py-20">{t.noRecipes}</div>;
  
  const translation = recipe.translations?.[lang] || {
    title: recipe.title,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    prepTime: recipe.prepTime,
    author: recipe.author,
    city: recipe.city
  };
  
  const isOwner = user?.id === recipe.userId || user?.nickname === recipe.author || user?.isAdmin;
  
  const handleTranslate = async () => {
    setTranslating(true);
    const result = await translateRecipeContent(recipe, lang);
    if (result) {
      await onUpdate({ 
        ...recipe, 
        translations: { ...recipe.translations, [lang]: result } 
      });
    }
    setTranslating(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <BackButton lang={lang} text={t.back} />
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-12 border border-stone-100">
        <div className="h-[300px] sm:h-[450px] relative bg-stone-50">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} className="w-full h-full object-cover" alt={translation.title}/>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-200">
              <ImageIcon className="w-24 h-24" />
            </div>
          )}
        </div>
        <div className="p-6 sm:p-12">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4 border-b border-stone-100 pb-8">
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold vintage-header text-amber-900 mb-4">{translation.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-stone-500">
                <span className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100"><Clock className="w-4 h-4 text-amber-600"/> {t.time}: <b>{translation.prepTime}</b></span>
                <span className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100"><MapPin className="w-4 h-4 text-amber-600"/> {t.city}: <b>{translation.city}</b></span>
                <span className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100"><UserIcon className="w-4 h-4 text-amber-600"/> {t.author}: <b>{translation.author}</b></span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {recipe.originalLang !== lang && !recipe.translations?.[lang] && (
                <button onClick={handleTranslate} disabled={translating} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold hover:bg-emerald-100 disabled:opacity-50 cursor-pointer">
                  {translating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Languages className="w-4 h-4"/>}
                  {translating ? t.translating : t.translateRecipe}
                </button>
              )}
              {isOwner && (
                <>
                  <Link to={`/edit-recipe/${recipe.id}`} className="p-3 bg-stone-100 rounded-xl text-amber-700 hover:bg-stone-200 transition-colors">
                    <Edit3 className="w-5 h-5"/>
                  </Link>
                  <button onClick={() => { if(window.confirm(t.confirmDelete)) { onDelete(recipe.id); navigate('/'); } }} className="p-3 bg-red-50 rounded-xl text-red-600 hover:bg-red-100 transition-colors cursor-pointer">
                    <Trash2 className="w-5 h-5"/>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h2 className="text-xl font-bold vintage-header text-amber-800 mb-6 border-b-2 border-amber-50 pb-2">{t.ingredients}</h2>
              <ul className="space-y-3">
                {translation.ingredients.map((ing: string, i: number) => (
                  <li key={i} className="flex gap-3 text-stone-700 font-medium bg-amber-50/30 p-2 rounded-lg border border-amber-50/50">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold vintage-header text-amber-800 mb-6 border-b-2 border-amber-50 pb-2">{t.steps}</h2>
              <div className="space-y-6">
                {translation.steps.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100 group">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold shrink-0 shadow-sm group-hover:scale-110 transition-transform">{i+1}</span>
                    <p className="text-stone-700 leading-relaxed font-medium pt-1 text-lg">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecipeForm = ({ lang, user, initialData, onSubmit, title }: any) => {
  const t = TRANSLATIONS[lang];
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || location.state?.category || 'main',
    ingredients: initialData?.ingredients?.join('\n') || '',
    steps: initialData?.steps?.join('\n') || '',
    city: initialData?.city || user?.city || '',
    prepTime: initialData?.prepTime || '',
    imageUrl: initialData?.imageUrl || '',
    author: initialData?.author || user?.nickname || ''
  });

  const handleAi = async () => {
    if(!formData.title) return alert(t.enterTitleAlert);
    setLoading(true);
    const result = await generateQuickRecipe(formData.title, lang);
    if(result) {
      setFormData(prev => ({
        ...prev,
        ingredients: result.ingredients.join('\n'),
        steps: result.steps.join('\n'),
        prepTime: result.prepTime
      }));
    }
    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setFormData(prev => ({ ...prev, imageUrl: compressed }));
    } catch (err) {
      console.error("Image processing error:", err);
      alert(t.cameraError);
    } finally {
      setUploading(false);
      // Reset input values to allow re-selection
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const recipe: Recipe = {
      id: initialData?.id || Date.now().toString(),
      title: formData.title,
      category: formData.category as any,
      ingredients: formData.ingredients.split('\n').map(x => x.trim()).filter(Boolean),
      steps: formData.steps.split('\n').map(x => x.trim()).filter(Boolean),
      prepTime: formData.prepTime,
      city: formData.city,
      author: formData.author,
      date: initialData?.date || new Date().toISOString().split('T')[0],
      userId: user.id,
      imageUrl: formData.imageUrl,
      originalLang: lang,
      translations: initialData?.translations || {}
    };
    onSubmit(recipe);
    navigate('/');
  };

  const inputStyle = "w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-all";
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold vintage-header text-amber-900 mb-8">{title}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl space-y-6 border border-stone-100">
        
        {/* Unified Photo Upload Section for Mobile Reliability */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-stone-500 px-1">{t.uploadPhoto}</label>
          <div 
            className="relative h-80 w-full border-2 border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center bg-stone-50/50 hover:bg-stone-50 transition-colors overflow-hidden group"
          >
            {formData.imageUrl ? (
              <div className="relative w-full h-full">
                <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-12 text-white">
                  <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
                    <Camera className="w-12 h-12" />
                    <span className="text-sm font-bold uppercase">{t.camera}</span>
                  </button>
                  <button type="button" onClick={() => galleryInputRef.current?.click()} className="flex flex-col items-center gap-2 hover:scale-110 transition-transform">
                    <Upload className="w-12 h-12" />
                    <span className="text-sm font-bold uppercase">{t.gallery}</span>
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFormData({...formData, imageUrl: ''}); }}
                  className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-xl z-10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-10 w-full px-6 text-center">
                {uploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-16 h-16 animate-spin text-amber-600" />
                    <span className="text-lg font-bold text-stone-500 uppercase tracking-widest">Processing Image...</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-8 sm:gap-20">
                    {/* Dedicated Camera Button */}
                    <button 
                      type="button" 
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center gap-4 group/btn"
                    >
                      <div className="p-8 bg-white border-2 border-stone-200 rounded-3xl group-hover/btn:bg-amber-100 group-hover/btn:border-amber-300 shadow-sm transition-all group-hover/btn:scale-110">
                         <Camera className="w-14 h-14 text-amber-800" />
                      </div>
                      <span className="text-md font-bold uppercase tracking-wider text-stone-600 group-hover/btn:text-amber-900 transition-colors">{t.camera}</span>
                    </button>

                    {/* Dedicated Gallery Button */}
                    <button 
                      type="button" 
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex flex-col items-center gap-4 group/btn"
                    >
                      <div className="p-8 bg-white border-2 border-stone-200 rounded-3xl group-hover/btn:bg-amber-100 group-hover/btn:border-amber-300 shadow-sm transition-all group-hover/btn:scale-110">
                         <Upload className="w-14 h-14 text-amber-800" />
                      </div>
                      <span className="text-md font-bold uppercase tracking-wider text-stone-600 group-hover/btn:text-amber-900 transition-colors">{t.gallery}</span>
                    </button>
                  </div>
                )}
                {!uploading && (
                  <p className="text-stone-400 text-sm mt-4 italic">{t.clickToChangePhoto}</p>
                )}
              </div>
            )}
            
            {/* Hidden Input for Camera - Uses native capture="environment" for highest reliability */}
            <input 
              type="file" 
              ref={cameraInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileChange} 
            />
            
            {/* Hidden Input for Gallery - Generic picker */}
            <input 
              type="file" 
              ref={galleryInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
        </div>

        <div className="flex gap-2">
          <input required placeholder={t.placeholderTitle} className={inputStyle} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <button type="button" onClick={handleAi} disabled={loading} className="px-5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center" title={t.aiHelp}>
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-stone-500 px-1">{t.displayAuthorLabel}</label>
          <input required placeholder={t.placeholderAuthor} className={inputStyle} value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select className={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option value="main">{t.mainDishes}</option>
            <option value="sweets">{t.sweets}</option>
            <option value="diet">{t.diet}</option>
          </select>
          <input required placeholder={t.time} className={inputStyle} value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: e.target.value})} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-stone-500 px-1">{t.ingredients}</label>
          <textarea required placeholder={t.placeholderIngredients} rows={5} className={inputStyle} value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-bold text-stone-500 px-1">{t.steps}</label>
          <textarea required placeholder={t.placeholderSteps} rows={5} className={inputStyle} value={formData.steps} onChange={e => setFormData({...formData, steps: e.target.value})} />
        </div>
        
        <input required placeholder={t.city} className={inputStyle} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
        
        <button type="submit" className="w-full py-4 bg-amber-700 text-white font-bold rounded-xl text-lg hover:bg-amber-800 transition-all shadow-md active:scale-95 cursor-pointer">
          {t.submit}
        </button>
      </form>
    </div>
  );
};

const EditView = ({ recipes, lang, user, onUpdate }: any) => {
  const { id } = useParams();
  const recipe = recipes.find((r: any) => r.id === id);
  if (!recipe) return <Navigate to="/" />;
  return <RecipeForm lang={lang} user={user} initialData={recipe} title={TRANSLATIONS[lang].edit} onSubmit={onUpdate} />;
};

const Auth = ({ lang, onLogin }: any) => {
  const t = TRANSLATIONS[lang];
  const navigate = useNavigate();
  const [data, setData] = useState({ nickname: '', password: '' });
  const handle = (e: any) => {
    e.preventDefault();
    const isAdmin = data.nickname === 'admin' && data.password === 'AR2019!';
    onLogin({ id: data.nickname, nickname: data.nickname, isAdmin, city: isAdmin ? 'Jerusalem' : '' });
    navigate('/');
  };
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-stone-100">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-amber-50 rounded-full">
            <UserIcon className="w-12 h-12 text-amber-700" />
          </div>
        </div>
        <h1 className="text-3xl font-bold vintage-header text-amber-900 text-center mb-8">{t.login}</h1>
        <form onSubmit={handle} className="space-y-6">
          <input required placeholder={t.nickname} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none" value={data.nickname} onChange={e => setData({...data, nickname: e.target.value})} />
          <input required type="password" placeholder={t.password} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl outline-none" value={data.password} onChange={e => setData({...data, password: e.target.value})} />
          <button className="w-full py-4 bg-amber-700 text-white font-bold rounded-xl text-lg hover:bg-amber-800 transition-all shadow-md cursor-pointer">
            {t.login}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-stone-400 leading-relaxed italic">
          {t.adminNotice}
        </p>
      </div>
    </div>
  );
};

export default App;
