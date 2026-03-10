import articlesData from '../data/wiki/articles.json';

export interface WikiArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  contentPath: string;
  isPublic: boolean;
}

export const wikiService = {
  /** Obtiene todos los artículos públicos */
  getPublicArticles(): WikiArticle[] {
    return articlesData.filter(a => a.isPublic);
  },

  /** Obtiene artículos por categoría */
  getArticlesByCategory(category: string): WikiArticle[] {
    return articlesData.filter(a => a.category === category && a.isPublic);
  },

  /** Busca artículos por texto */
  searchArticles(query: string): WikiArticle[] {
    const s = query.toLowerCase();
    return articlesData.filter(a => 
      a.isPublic && 
      (a.title.toLowerCase().includes(s) || a.excerpt.toLowerCase().includes(s))
    );
  },

  /** Obtiene el contenido de un artículo (Markdown) */
  async getArticleContent(contentPath: string): Promise<string> {
    try {
      // En un entorno de build, fetch funcionará si los archivos están en public o si se importan dinámicamente.
      // Aquí asumo que los archivos .md están disponibles o se sirven.
      // Para una implementación simple, podemos usar fetch o un import dinámico si Vite lo permite.
      const response = await fetch(contentPath);
      if (!response.ok) throw new Error('No se pudo cargar el artículo');
      return await response.text();
    } catch (error) {
      console.error('Error loading wiki content:', error);
      return 'Lo sentimos, no se pudo cargar el contenido de este artículo.';
    }
  }
};
