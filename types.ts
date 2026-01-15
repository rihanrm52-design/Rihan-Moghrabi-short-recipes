
export type Category = 'main' | 'sweets' | 'diet';
export type Language = 'ar' | 'he';

export interface User {
  id: string;
  email: string;
  nickname: string;
  isAdmin: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  category: Category;
  ingredients: string[];
  steps: string[];
  prepTime: string;
  author: string;
  city: string;
  date: string;
  userId: string;
  imageUrl?: string;
  originalLang: Language;
  // Optional cache for translations
  translations?: Partial<Record<Language, {
    title: string;
    ingredients: string[];
    steps: string[];
    prepTime: string;
    author: string;
    city: string;
  }>>;
}

export interface Translation {
  title: string;
  home: string;
  mainDishes: string;
  sweets: string;
  diet: string;
  search: string;
  login: string;
  register: string;
  logout: string;
  addRecipe: string;
  edit: string;
  adminPanel: string;
  welcome: string;
  ingredients: string;
  steps: string;
  time: string;
  author: string;
  city: string;
  date: string;
  delete: string;
  noRecipes: string;
  placeholderTitle: string;
  placeholderIngredients: string;
  placeholderSteps: string;
  placeholderCity: string;
  submit: string;
  nickname: string;
  email: string;
  password: string;
  back: string;
  lazySlogan: string;
  aiHelp: string;
  aiLoading: string;
  communityRecipes: string;
  addYourOwn: string;
  uploadPhoto: string;
  translateRecipe: string;
  translating: string;
  adminBadge: string;
  adminNotice: string;
  confirmDelete: string;
  fastTime: string;
  enterTitleAlert: string;
  clickToChangePhoto: string;
  guest: string;
  contactUs: string;
  close: string;
  copyEmail: string;
  emailCopied: string;
}
