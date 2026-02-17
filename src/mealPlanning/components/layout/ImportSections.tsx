import React, { type ReactElement } from 'react';
import { ChefHat, Link, Loader2, Plus } from 'lucide-react';
import type { Recipe } from '../../../types';
import { RecipeDraftPreview } from './RecipeDraftPreview';
import type { RecipeImportState } from '../../hooks/useRecipeImport';

interface ImportSectionsProps {
  recipeImport: RecipeImportState;
  createRecipe: (recipe: Partial<Recipe>) => Promise<unknown>;
}

/**
 * Recipe import sections (URL and Text)
 * URL import auto-detects YouTube videos vs recipe websites
 */
export function ImportSections({
  recipeImport,
  createRecipe,
}: ImportSectionsProps): ReactElement {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {/* Unified Import from URL (auto-detects YouTube vs recipe site) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void recipeImport.importFromUrl();
        }}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          <Link className="h-5 w-5 text-[#C18B5E]" />
          Import from URL
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          Paste a recipe website or YouTube cooking video URL
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={recipeImport.importUrl}
            onChange={(e) => recipeImport.setImportUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-[#C18B5E] focus:outline-none focus:ring-2 focus:ring-[#E5B88A]/20 dark:focus:ring-[#8B6F47]"
          />
          {/* Show language selector only for YouTube URLs */}
          {recipeImport.isYoutube && (
            <select
              value={recipeImport.lang}
              onChange={(e) => recipeImport.setLang(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-[#C18B5E] focus:outline-none focus:ring-2 focus:ring-[#E5B88A]/20 dark:focus:ring-[#8B6F47]"
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
          )}
          <button
            type="submit"
            disabled={recipeImport.isImporting || !recipeImport.importUrl.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#C18B5E] hover:bg-[#B5795A] px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
          >
            {recipeImport.isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {recipeImport.isYoutube ? 'Extract recipe' : 'Clip recipe'}
          </button>
        </div>
        {recipeImport.isYoutube && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            🎬 YouTube detected — will extract recipe from video captions
          </p>
        )}
        {recipeImport.importError && (
          <p className="mt-3 text-sm text-rose-600">{recipeImport.importError}</p>
        )}

        {recipeImport.importDraft && (
          <RecipeDraftPreview
            draft={recipeImport.importDraft}
            onSave={() => {
              return (async (): Promise<void> => {
                try {
                  if (recipeImport.importDraft) {
                    await createRecipe(recipeImport.importDraft);
                  }
                  recipeImport.clearImport();
                } catch {
                  recipeImport.setImportError?.('Failed to save recipe');
                }
              })();
            }}
            onCancel={recipeImport.clearImport}
          />
        )}
      </form>

      {/* Paste Text */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void recipeImport.parseFromText();
        }}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          <ChefHat className="h-5 w-5 text-amber-600" />
          Paste text
        </h2>
        <div className="grid gap-3">
          <input
            value={recipeImport.textTitle}
            onChange={(e) => recipeImport.setTextTitle(e.target.value)}
            placeholder="Optional title"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
          />
          <input
            value={recipeImport.textImageUrl}
            onChange={(e) => recipeImport.setTextImageUrl(e.target.value)}
            placeholder="Optional image URL"
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
          />
          <textarea
            rows={6}
            value={recipeImport.textInput}
            onChange={(e) => recipeImport.setTextInput(e.target.value)}
            placeholder="Ingredients and directions..."
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={recipeImport.isTextParsing || !recipeImport.textInput.trim()}
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
            className="rounded-md border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Clear
          </button>
        </div>
        {recipeImport.textError && (
          <p className="mt-3 text-sm text-rose-600">{recipeImport.textError}</p>
        )}

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
