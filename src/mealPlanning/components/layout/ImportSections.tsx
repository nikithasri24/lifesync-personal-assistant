import React, { type ReactElement, type FormEvent } from 'react';
import { CalendarDays, ChefHat, Loader2, Plus, Youtube } from 'lucide-react';
import type { Recipe } from '../../../types';
import { RecipeDraftPreview } from './RecipeDraftPreview';

interface ImportSectionsProps {
  recipeImport: {
    videoUrl: string;
    setVideoUrl: (url: string) => void;
    videoLang: string;
    setVideoLang: (lang: string) => void;
    isVideoImporting: boolean;
    videoImportError: string | null;
    videoDraft: Partial<Recipe> | null;
    importFromVideo: () => Promise<void>;
    clearVideoImport: () => void;
    setVideoImportError?: (error: string | null) => void;
    importUrl: string;
    setImportUrl: (url: string) => void;
    isImporting: boolean;
    importError: string | null;
    importDraft: Partial<Recipe> | null;
    clearUrlImport: () => void;
    textTitle: string;
    setTextTitle: (title: string) => void;
    textImageUrl: string;
    setTextImageUrl: (url: string) => void;
    textInput: string;
    setTextInput: (input: string) => void;
    isTextParsing: boolean;
    textError: string | null;
    textDraft: Partial<Recipe> | null;
    parseFromText: () => Promise<void>;
    clearTextImport: () => void;
    setTextError?: (error: string | null) => void;
  };
  createRecipe: (recipe: Partial<Recipe>) => Promise<unknown>;
  handleImportRecipe: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  saveImportedRecipe: () => Promise<void>;
}

/**
 * Recipe import sections (Video, URL, Text)
 */
export function ImportSections({
  recipeImport,
  createRecipe,
  handleImportRecipe,
  saveImportedRecipe,
}: ImportSectionsProps): ReactElement {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {/* Video to Recipe (YouTube) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void recipeImport.importFromVideo();
        }}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
          <Youtube className="h-5 w-5 text-rose-600" />
          Video to recipe
        </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={recipeImport.videoUrl}
              onChange={(e) => recipeImport.setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <select
              value={recipeImport.videoLang}
              onChange={(e) => recipeImport.setVideoLang(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              title="Caption language"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="hi">Hindi</option>
              <option value="ja">Japanese</option>
            </select>
          <button
            type="submit"
            disabled={recipeImport.isVideoImporting}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 hover:bg-rose-500 px-3 py-2 text-sm font-medium text-white transition disabled:opacity-60"
          >
            {recipeImport.isVideoImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Convert
          </button>
        </div>
        {recipeImport.videoImportError && (
          <p className="mt-3 text-sm text-rose-600">{recipeImport.videoImportError}</p>
        )}

        {recipeImport.videoDraft && (
          <RecipeDraftPreview
            draft={recipeImport.videoDraft}
            onSave={() => {
              return (async (): Promise<void> => {
                try {
                  if (recipeImport.videoDraft) {
                    await createRecipe(recipeImport.videoDraft);
                  }
                  recipeImport.clearVideoImport();
                } catch {
                  recipeImport.setVideoImportError?.('Failed to save recipe');
                }
              })();
            }}
            onCancel={recipeImport.clearVideoImport}
          />
        )}
      </form>

      {/* Clip from URL */}
      <form onSubmit={(e) => void handleImportRecipe(e)} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          Clip from URL
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={recipeImport.importUrl}
            onChange={(e) => recipeImport.setImportUrl(e.target.value)}
            placeholder="https://example.com/recipe/..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            disabled={recipeImport.isImporting}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition disabled:opacity-60"
          >
            {recipeImport.isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Clip recipe
          </button>
        </div>
        {recipeImport.importError && <p className="mt-3 text-sm text-rose-600">{recipeImport.importError}</p>}

        {recipeImport.importDraft && (
          <RecipeDraftPreview
            draft={recipeImport.importDraft}
            onSave={saveImportedRecipe}
            onCancel={recipeImport.clearUrlImport}
          />
        )}
      </form>

      {/* Paste Text */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void recipeImport.parseFromText();
        }}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
          <ChefHat className="h-5 w-5 text-amber-600" />
          Paste text
        </h2>
        <div className="mt-3 grid gap-3">
          <input
            value={recipeImport.textTitle}
            onChange={(e) => recipeImport.setTextTitle(e.target.value)}
            placeholder="Optional title"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <input
            value={recipeImport.textImageUrl}
            onChange={(e) => recipeImport.setTextImageUrl(e.target.value)}
            placeholder="Optional image URL"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            rows={8}
            value={recipeImport.textInput}
            onChange={(e) => recipeImport.setTextInput(e.target.value)}
            placeholder="Ingredients and directions..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={recipeImport.isTextParsing}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-60"
          >
            {recipeImport.isTextParsing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Parse text
          </button>
          <button
            type="button"
            onClick={recipeImport.clearTextImport}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
        {recipeImport.textError && <p className="mt-3 text-sm text-rose-600">{recipeImport.textError}</p>}

        {recipeImport.textDraft && (
          <RecipeDraftPreview
            draft={recipeImport.textDraft}
            imageUrl={recipeImport.textImageUrl}
            onSave={() => {
              return (async (): Promise<void> => {
                try {
                  if (recipeImport.textDraft) {
                    await createRecipe({
                      ...recipeImport.textDraft,
                      image: recipeImport.textDraft.image ?? recipeImport.textImageUrl ?? undefined,
                    });
                  }
                  recipeImport.clearTextImport();
                } catch (_e) {
                  recipeImport.setTextError?.('Failed to save recipe');
                }
              })();
            }}
            onCancel={recipeImport.clearTextImport}
          />
        )}
      </form>
    </section>
  );
}
