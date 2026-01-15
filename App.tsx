import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { 
  Utensils, 
  IceCream, 
  Leaf, 
  Plus, 
  LogOut, 
  Trash2, 
  Search, 
  Clock, 
  MapPin, 
  Calendar, 
  User as UserIcon,
  ChevronLeft,
  Sparkles,
  Globe,
  Users,
  ArrowRight,
  Camera,
  Languages,
  Edit3,
  X,
  Mail,
  Loader2,
  Check,
  Copy
} from 'lucide-react';
import { TRANSLATIONS, INITIAL_RECIPES, ADMIN_EMAIL } from './constants';
import { Recipe, User, Language, Category } from './types';
import { generateQuickRecipe, translateRecipeContent } from './geminiService';

// --- Shared Helper Components ---

const BackButton: React.FC<{ lang: Language; text: string }> = ({ lang, text }) => {
  const navigate = useNavigate();
  
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(-1);
  };

  return (
    <button 
      type="button"
      onClick={handleBack} 
      className="flex items-center gap-1 text-stone-500 hover:text-amber-700 mb-6 group transition-colors cursor-pointer py-1 px-2 -mx-2 rounded-md hover:bg-stone-100/50 outline-none"
    >
      <ChevronLeft className={`w-5 h-5 transition-transform ${lang === 'ar' || lang === 'he' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
      <span className="font-medium">{text}</span>
    </button>
  );
};

const ContactModal: React.FC<{ lang: Language; isOpen: boolean; onClose: () => void }> = ({ lang, isOpen, onClose }) => {
  const t = TRANSLATIONS[lang];
  const adminEmail = ADMIN_EMAIL;
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(adminEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-stone-100">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-amber-50/50">
          <h2 className="text-xl font-bold vintage-header text-amber-900 flex items-center gap-2">
            <Mail className="w-5 h-5" /> {t.contactUs}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="p-8 text-center">
          <div className="mb-6 p-6 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center gap-4 shadow-inner">
            <div className="p-4 bg-white rounded-full shadow-sm text-amber-700">
               <Mail className="w-8 h-8" />
            </div>
            <span className="font-bold text-lg text-stone-800 break-all">{adminEmail}</span>
            
            <button 
              onClick={handleCopy}
              className={`w-full py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 font-bold ${copied ? 'bg-emerald-600 text-white shadow-lg' : 'bg-amber-700 text-white hover:bg-amber-800 shadow-md active:scale-95'}`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? t.emailCopied : t.copyEmail}
            </button>
          </div>
          
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 font-bold transition-colors text-sm">
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Components ---

const Navbar: React.FC<{ 
  lang: Language; 
  setLang: (l: Language) => void;
  user: User | null;
  onLogout: () => void;
}> = ({ lang, setLang, user, onLogout }) => {
  const t = TRANSLATIONS[lang];
  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold vintage-header text-amber-900 shrink-0">
          <Utensils className="w-6 h-6 sm:w-8 h-8 text-amber-700" />
          <span className="hidden xs:inline">{t.title}</span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <button 
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'he' : 'ar')}
            className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm bg-stone-100 hover:bg-stone-200 rounded-full border border-stone-300 transition-colors whitespace-nowrap"
          >
            <Globe className="w-3 h-3 sm:w-4 h-4" />
            {lang === 'ar' ? 'עברית' : 'عربي'}
          </button>

          <div className="h-6 w-px bg-stone-300"></div>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col items-end leading-none">
                <span className="text-[10px] sm:text-sm font-medium text-stone-600 truncate max-w-[60px] sm:max-w-none">
                  {user.nickname}
                </span>
                {user.isAdmin && (
                  <span className="text-[8px] sm:text-[10px] bg-amber-100 text-amber-800 px-1 rounded uppercase font-bold mt-0.5">
                    {t.adminBadge}
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={onLogout}
                className="p-1.5 sm:p-2 text-stone-500 hover:text-red-600 transition-colors"
                title={t.logout}
              >
                <LogOut className="w-4 h-4 sm:w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link to="/auth/login" className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors whitespace-nowrap">
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
  const isAdmin = user?.isAdmin === true;
  const isOwner = user && (user.id === recipe.userId || user.nickname === recipe.author);
  
  const canDelete = isAdmin || isOwner;
  const canEdit = isAdmin || isOwner;

  const translation = recipe.translations?.[lang];
  const displayTitle = translation?.title || recipe.title;
  const displayCity = translation?.city || recipe.city;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow group relative">
      <Link to={`/recipe/${recipe.id}`}>
        <img 
          src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/400/300`} 
          alt={displayTitle} 
          className="w-full h-36 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="p-4">
          <h3 className="text-base font-bold text-stone-800 mb-1 line-clamp-1">{displayTitle}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-stone-500 uppercase tracking-wider">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {translation?.prepTime || recipe.prepTime}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {displayCity}</span>
            </div>
          </div>
        </div>
      </Link>
      
      {(canDelete || canEdit) && (
        <div className="absolute top-2 left-2 flex gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <Link 
              to={`/edit-recipe/${recipe.id}`}
              className="p-1.5 bg-amber-600/90 text-white rounded-full hover:bg-amber-700 transition-colors shadow-sm"
              title={t.edit}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>
          )}
          {canDelete && onDelete && (
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(recipe.id); }}
              className="p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
              title={t.delete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// --- Shared Form Component ---

const RecipeForm: React.FC<{
  lang: Language;
  user: User | null;
  initialData?: Partial<Recipe>;
  onSubmit: (r: Recipe) => void;
  title: string;
}> = ({ lang, user, initialData, onSubmit, title }) => {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.imageUrl || null);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'main',
    ingredients: initialData?.ingredients?.join('\n') || '',
    steps: initialData?.steps?.join('\n') || '',
    city: initialData?.city || '',
    prepTime: initialData?.prepTime || '',
    author: initialData?.author || user?.nickname || '',
    imageUrl: initialData?.imageUrl || ''
  });

  const inputBaseClass = "w-full px-4 py-3 bg-stone-800 text-white border border-stone-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all placeholder-stone-400 font-medium shadow-inner";

  const handleAiAssist = async () => {
    if (!formData.title) return alert(t.enterTitleAlert);
    setLoading(true);
    const result = await generateQuickRecipe(formData.title, lang);
    if (result) {
      setFormData(prev => ({
        ...prev,
        ingredients: result.ingredients.join('\n'),
        steps: result.steps.join('\n'),
        prepTime: result.prepTime || prev.prepTime
      }));
    }
    setLoading(false);
  };

  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        const compressedBase64 = await compressImage(rawBase64);
        setPhotoPreview(compressedBase64);
        setFormData(prev => ({ ...prev, imageUrl: compressedBase64 }));
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe: Recipe = {
      id: initialData?.id || Date.now().toString(),
      title: formData.title,
      category: formData.category as Category,
      ingredients: formData.ingredients.split('\n').filter(i => i.trim()),
      steps: formData.steps.split('\n').filter(s => s.trim()),
      prepTime: formData.prepTime || t.fastTime,
      author: formData.author || t.guest,
      city: formData.city,
      date: initialData?.date || new Date().toISOString().split('T')[0],
      userId: initialData?.userId || user?.id || 'guest',
      imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.title}/600/400`,
      originalLang: (initialData?.originalLang as Language) || lang,
      translations: initialData?.translations || {}
    };
    onSubmit(recipe);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <BackButton lang={lang} text={t.back} />
      <h1 className="text-2xl sm:text-3xl font-bold vintage-header text-amber-900 mb-6 sm:mb-8">{title}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-stone-100 space-y-6 sm:space-y-8">
        <div>
          <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wider">{t.placeholderTitle}</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              required
              type="text" 
              className={inputBaseClass}
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
            <button 
              type="button"
              onClick={handleAiAssist}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-stone-300 transition-all shadow-md active:scale-95 shrink-0"
            >
              <Sparkles className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
              <span className="font-bold">{t.aiHelp}</span>
            </button>
          </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wider">{t.uploadPhoto}</label>
           <div 
             onClick={() => fileInputRef.current?.click()}
             className={`relative w-full h-36 sm:h-64 bg-stone-100 border-2 border-dashed border-stone-300 rounded-2xl cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition-all overflow-hidden flex flex-col items-center justify-center group ${loading ? 'opacity-50 pointer-events-none' : ''}`}
           >
             {photoPreview ? (
               <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
             ) : (
               <>
                 <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                   <Camera className="w-6 h-6 sm:w-10 h-10 text-stone-400 group-hover:text-amber-500 transition-colors" />
                 </div>
                 <span className="text-[10px] sm:text-sm text-stone-500 font-bold">{loading ? t.aiLoading : t.uploadPhoto}</span>
               </>
             )}
             <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wider">{t.mainDishes}</label>
            <select 
              className={inputBaseClass}
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value as Category})}
            >
              <option className="bg-stone-800" value="main">{t.mainDishes}</option>
              <option className="bg-stone-800" value="sweets">{t.sweets}</option>
              <option className="bg-stone-800" value="diet">{t.diet}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wider">{t.time}</label>
            <input 
              required
              type="text" 
              className={inputBaseClass}
              value={formData.prepTime}
              onChange={e => setFormData({...formData, prepTime: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wider">{t.ingredients}</label>
          <textarea 
            required
            rows={5}
            placeholder={t.placeholderIngredients}
            className={inputBaseClass}
            value={formData.ingredients}
            onChange={e => setFormData({...formData, ingredients: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-stone-600 mb-3 uppercase tracking-wider">{t.steps}</label>
          <textarea 
            required
            rows={8}
            placeholder={t.placeholderSteps}
            className={inputBaseClass}
            value={formData.steps}
            onChange={e => setFormData({...formData, steps: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-3 uppercase tracking-wider">{t.nickname}</label>
            <input 
              required
              type="text" 
              className={inputBaseClass}
              value={formData.author}
              onChange={e => setFormData({...formData, author: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-3 uppercase tracking-wider">{t.city}</label>
            <input 
              required
              type="text" 
              className={inputBaseClass}
              placeholder={t.placeholderCity}
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-amber-700 text-white text-lg sm:text-xl font-bold rounded-2xl hover:bg-amber-800 transition-all shadow-lg active:scale-95 transform disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t.submit}
        </button>
      </form>
    </div>
  );
};

// --- Home ---

const Home: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const categories = [
    { id: 'main', label: t.mainDishes, icon: <Utensils className="w-8 h-8 sm:w-10 h-10"/>, color: 'bg-amber-100 text-amber-800', hoverColor: 'hover:bg-amber-200' },
    { id: 'sweets', label: t.sweets, icon: <IceCream className="w-8 h-8 sm:w-10 h-10"/>, color: 'bg-pink-100 text-pink-800', hoverColor: 'hover:bg-pink-200' },
    { id: 'diet', label: t.diet, icon: <Leaf className="w-8 h-8 sm:w-10 h-10"/>, color: 'bg-emerald-100 text-emerald-800', hoverColor: 'hover:bg-emerald-200' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-10 sm:mb-16">
        <h1 className="text-3xl sm:text-5xl font-bold vintage-header text-amber-900 mb-4">{t.title}</h1>
        <p className="text-lg sm:text-xl text-stone-600 italic px-4">{t.welcome}</p>
        <p className="mt-2 text-sm sm:text-base text-stone-400">{t.lazySlogan}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        {categories.map((cat) => (
          <div key={cat.id} className="relative group">
            <Link to={`/category/${cat.id}`} className="flex flex-col items-center p-6 sm:p-8 rounded-2xl bg-white border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all w-full h-full">
              <div className={`p-4 sm:p-6 rounded-full ${cat.color} mb-4 sm:mb-6 transition-colors ${cat.hoverColor}`}>{cat.icon}</div>
              <h2 className="text-xl sm:text-2xl font-bold vintage-header text-stone-800">{cat.label}</h2>
            </Link>
            
            <Link 
              to="/add-recipe" 
              state={{ category: cat.id }}
              className="absolute top-4 right-4 p-2 bg-amber-700 text-white rounded-full shadow-lg sm:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
              title={t.addRecipe}
            >
              <Plus className="w-4 h-4 sm:w-5 h-5" />
            </Link>
          </div>
        ))}
      </div>
      
      <div className="mt-12 sm:mt-20 text-center">
        <Link to="/add-recipe" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-amber-700 text-white text-base sm:text-lg font-bold rounded-full shadow-lg hover:bg-amber-800 transition-all hover:scale-105">
          <Plus className="w-5 h-5 sm:w-6 h-6" />
          {t.addRecipe}
        </Link>
      </div>
    </div>
  );
};

// --- CategoryPage ---

const CategoryPage: React.FC<{ 
  recipes: Recipe[]; 
  lang: Language;
  onDelete: (id: string) => void;
  user: User | null;
}> = ({ recipes, lang, onDelete, user }) => {
  const { catId } = useParams();
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');

  const filtered = recipes.filter(r => 
    r.category === catId && 
    (r.title.toLowerCase().includes(search.toLowerCase()) || 
     r.ingredients.some(i => i.toLowerCase().includes(search.toLowerCase())))
  );

  const catName = catId === 'main' ? t.mainDishes : catId === 'sweets' ? t.sweets : t.diet;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <BackButton lang={lang} text={t.back} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <h1 className="text-2xl sm:text-4xl font-bold vintage-header text-amber-900">{catName}</h1>
          <Link 
            to="/add-recipe" 
            state={{ category: catId }}
            className="flex items-center gap-1 px-3 py-2 bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-full shadow-md hover:bg-amber-800 transition-all hover:scale-105"
          >
            <Plus className="w-3 h-3 sm:w-4 h-4" />
            {t.addRecipe}
          </Link>
        </div>
        
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder={t.search} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pr-10 pl-4 py-3 border border-stone-200 rounded-xl w-full md:w-80 focus:ring-2 focus:ring-amber-500 outline-none text-amber-800 shadow-sm" 
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {filtered.map(r => <RecipeCard key={r.id} recipe={r} lang={lang} onDelete={onDelete} user={user} />)}
        </div>
      ) : (
        <div className="text-center py-16 sm:py-24 bg-white/50 rounded-3xl border-2 border-dashed border-stone-200">
          <p className="text-stone-400 italic mb-6 text-base sm:text-lg">{t.noRecipes}</p>
          <Link 
            to="/add-recipe" 
            state={{ category: catId }}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-amber-700 text-white font-bold rounded-2xl hover:bg-amber-800 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5 sm:w-6 h-6" />
            {t.addRecipe}
          </Link>
        </div>
      )}
    </div>
  );
};

// --- RecipeDetail ---

const RecipeDetail: React.FC<{ 
  recipes: Recipe[]; 
  lang: Language;
  user: User | null;
  onDelete: (id: string) => void;
  onUpdate: (recipe: Recipe) => void;
}> = ({ recipes, lang, user, onDelete, onUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = recipes.find(r => r.id === id);
  const t = TRANSLATIONS[lang];

  const [isTranslating, setIsTranslating] = useState(false);

  const communityRecipes = useMemo(() => {
    return recipes.filter(r => r.category === recipe?.category && r.id !== recipe?.id).slice(0, 4);
  }, [recipes, recipe]);

  const handleTranslate = async () => {
    if (!recipe) return;
    setIsTranslating(true);
    const result = await translateRecipeContent(recipe, lang);
    if (result) {
      const updatedRecipe = {
        ...recipe,
        translations: {
          ...recipe.translations,
          [lang]: result
        }
      };
      onUpdate(updatedRecipe);
    }
    setIsTranslating(false);
  };

  if (!recipe) return <div className="p-20 text-center">404 - {t.noRecipes}</div>;

  const translation = recipe.translations?.[lang];
  const displayContent = translation || {
    title: recipe.title,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    prepTime: recipe.prepTime,
    author: recipe.author,
    city: recipe.city
  };

  const isAdmin = user?.isAdmin === true;
  const isOwner = user && (user.id === recipe.userId || user.nickname === recipe.author);
  
  const canDelete = isAdmin || isOwner;
  const canEdit = isAdmin || isOwner;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <BackButton lang={lang} text={t.back} />
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {canEdit && (
            <Link to={`/edit-recipe/${recipe.id}`} className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-stone-100 text-amber-700 rounded-lg hover:bg-stone-200 transition-colors border border-amber-200 shadow-sm">
              <Edit3 className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-bold">{t.edit}</span>
            </Link>
          )}
          {canDelete && (
            <button 
              type="button"
              onClick={() => { if(window.confirm(t.confirmDelete)) { onDelete(recipe.id); navigate('/'); } }} 
              className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-bold">{t.delete}</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 sm:mb-12 border border-stone-100">
        <img src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/800/400`} className="w-full h-48 sm:h-[450px] object-cover" alt={displayContent.title} />
        <div className="p-6 sm:p-12">
          <div className="flex flex-col gap-6 mb-8 border-b border-stone-100 pb-6">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-stone-500">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 sm:w-5 h-5 text-amber-600" /> <span>{t.time}: <b>{displayContent.prepTime}</b></span></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 sm:w-5 h-5 text-amber-600" /> <span>{t.city}: <b>{displayContent.city}</b></span></div>
              <div className="flex items-center gap-2"><UserIcon className="w-4 h-4 sm:w-5 h-5 text-amber-600" /> <span>{t.author}: <b>{displayContent.author}</b></span></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 sm:w-5 h-5 text-amber-600" /> <span>{t.date}: <b>{recipe.date}</b></span></div>
            </div>
            {recipe.originalLang !== lang && !recipe.translations?.[lang] && (
              <button 
                type="button"
                onClick={handleTranslate} 
                disabled={isTranslating} 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 text-amber-700 font-bold rounded-lg hover:bg-amber-50 disabled:opacity-50 border border-amber-200"
              >
                {isTranslating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                {isTranslating ? t.translating : t.translateRecipe}
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold vintage-header text-amber-900 mb-8">{displayContent.title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12">
            <div className="md:col-span-1">
              <h2 className="text-xl sm:text-2xl font-bold vintage-header text-amber-800 mb-4 border-b-2 border-amber-100 pb-2">{t.ingredients}</h2>
              <ul className="space-y-3">{displayContent.ingredients.map((ing, i) => <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span><span className="text-stone-700 font-medium text-sm sm:text-base">{ing}</span></li>)}</ul>
            </div>
            <div className="md:col-span-2">
              <h2 className="text-xl sm:text-2xl font-bold vintage-header text-amber-800 mb-4 border-b-2 border-amber-100 pb-2">{t.steps}</h2>
              <ol className="space-y-6">{displayContent.steps.map((step, i) => <li key={i} className="flex gap-4"><span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 text-amber-800 font-bold shrink-0 text-xs sm:text-sm">{i + 1}</span><p className="text-stone-700 leading-relaxed pt-1 font-medium text-sm sm:text-base">{step}</p></li>)}</ol>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-4 gap-2">
          <h2 className="text-xl sm:text-2xl font-bold vintage-header text-amber-900 flex items-center gap-2"><Users className="w-5 h-5 sm:w-6 h-6 text-amber-700" />{t.communityRecipes}</h2>
          <Link to="/add-recipe" state={{ category: recipe.category }} className="flex items-center gap-2 text-amber-700 font-bold hover:underline text-sm sm:text-base">{t.addYourOwn}<ArrowRight className={`w-4 h-4 ${lang === 'ar' || lang === 'he' ? 'rotate-180' : ''}`} /></Link>
        </div>
        {communityRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {communityRecipes.map(r => <RecipeCard key={r.id} recipe={r} lang={lang} onDelete={onDelete} user={user} />)}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
             <p className="text-stone-500 italic mb-4">{t.noRecipes}</p>
             <Link to="/add-recipe" state={{ category: recipe.category }} className="inline-flex items-center gap-2 px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"><Plus className="w-4 h-4" />{t.addYourOwn}</Link>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Auth ---

const Auth: React.FC<{ lang: Language; onLogin: (u: User) => void }> = ({ lang, onLogin }) => {
  const t = TRANSLATIONS[lang];
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', nickname: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = (formData.nickname.trim().toLowerCase() === 'admin') && (formData.password === 'AR2019');
    const user: User = {
      id: formData.nickname,
      email: `${formData.nickname}@kitchen.com`, 
      nickname: formData.nickname,
      isAdmin: isAdmin
    };
    onLogin(user);
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20">
      <BackButton lang={lang} text={t.back} />
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-stone-100">
        <h1 className="text-2xl sm:text-3xl font-bold vintage-header text-amber-900 mb-6 text-center">
          {t.login}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">{t.nickname}</label>
            <input 
              required 
              type="text" 
              className="w-full px-4 py-3 bg-stone-800 text-white border border-stone-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-inner font-medium" 
              value={formData.nickname} 
              onChange={e => setFormData({...formData, nickname: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">{t.password}</label>
            <input 
              required 
              type="password" 
              className="w-full px-4 py-3 bg-stone-800 text-white border border-stone-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-inner font-medium" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>
          <button type="submit" className="w-full py-3 bg-amber-700 text-white font-bold rounded-lg hover:bg-amber-800 transition-colors shadow-lg active:scale-95">
            {t.login}
          </button>
        </form>
        <p className="mt-4 text-[10px] sm:text-xs text-stone-400 text-center italic">
          {t.adminNotice}
        </p>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [isContactOpen, setIsContactOpen] = useState(false);
  
  // Safe user initialization
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Safe recipe initialization
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem('recipes');
      return saved ? JSON.parse(saved) : INITIAL_RECIPES;
    } catch {
      return INITIAL_RECIPES;
    }
  });

  useEffect(() => { 
    try {
      localStorage.setItem('recipes', JSON.stringify(recipes)); 
    } catch (e) {
      console.error("LocalStorage quota exceeded", e);
    }
  }, [recipes]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const handleDelete = (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateRecipe = (updated: Recipe) => {
    setRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleAddRecipe = (newR: Recipe) => {
    setRecipes(prev => [newR, ...prev]);
  };

  const AddRecipePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const defaultCat = location.state?.category as Category;
    
    useEffect(() => {
      if (!user) {
        navigate('/auth/login', { replace: true });
      }
    }, [user, navigate]);

    if (!user) return null;
    
    return (
      <RecipeForm 
        lang={lang} 
        user={user} 
        initialData={defaultCat ? { category: defaultCat } : undefined}
        title={TRANSLATIONS[lang].addRecipe} 
        onSubmit={(r) => { handleAddRecipe(r); navigate('/'); }} 
      />
    );
  };

  const EditRecipePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const recipeToEdit = recipes.find(r => r.id === id);
    const canEdit = user && recipeToEdit && (recipeToEdit.userId === user.id || recipeToEdit.author === user.nickname || user.isAdmin === true);
    
    if (!canEdit) {
      return <Navigate to="/" replace />;
    }
    
    return (
      <RecipeForm 
        lang={lang} 
        user={user} 
        initialData={recipeToEdit} 
        title={TRANSLATIONS[lang].edit} 
        onSubmit={(r) => { handleUpdateRecipe(r); navigate(`/recipe/${r.id}`); }} 
      />
    );
  };

  return (
    <HashRouter>
      <div className={`min-h-screen flex flex-col ${lang === 'he' ? 'font-[Heebo]' : 'font-[Vazirmatn]'}`}>
        <Navbar 
          lang={lang} 
          setLang={setLang} 
          user={user} 
          onLogout={() => setUser(null)} 
        />
        <main className="flex-1 pb-20">
          <Routes>
            <Route path="/" element={<Home lang={lang} />} />
            <Route path="/category/:catId" element={<CategoryPage recipes={recipes} lang={lang} onDelete={handleDelete} user={user} />} />
            <Route path="/recipe/:id" element={<RecipeDetail recipes={recipes} lang={lang} user={user} onDelete={handleDelete} onUpdate={handleUpdateRecipe} />} />
            <Route path="/edit-recipe/:id" element={<EditRecipePage />} />
            <Route path="/add-recipe" element={<AddRecipePage />} />
            <Route path="/auth/login" element={<Auth lang={lang} onLogin={setUser} />} />
          </Routes>
        </main>

        <footer className="bg-stone-900 text-stone-400 py-8 sm:py-12 px-4 border-t border-stone-800">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
            <div>
              <h3 className="text-white vintage-header text-xl mb-2">{TRANSLATIONS[lang].title}</h3>
              <p className="text-xs sm:text-sm max-w-xs">{TRANSLATIONS[lang].welcome}</p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 text-sm">
              <Link to="/" className="hover:text-amber-500 transition-colors">{TRANSLATIONS[lang].home}</Link>
              <Link to="/category/main" className="hover:text-amber-500 transition-colors">{TRANSLATIONS[lang].mainDishes}</Link>
              <button 
                onClick={() => setIsContactOpen(true)}
                className="flex items-center gap-1 text-amber-500 hover:text-amber-400 font-bold transition-colors"
              >
                <Mail className="w-4 h-4" />
                {TRANSLATIONS[lang].contactUs}
              </button>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-8 sm:mt-12 pt-8 border-t border-stone-800 text-center text-[10px] sm:text-xs">
            © {new Date().getFullYear()} QuickCuisine. {TRANSLATIONS[lang].lazySlogan}
          </div>
        </footer>

        <ContactModal lang={lang} isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      </div>
    </HashRouter>
  );
};

export default App;