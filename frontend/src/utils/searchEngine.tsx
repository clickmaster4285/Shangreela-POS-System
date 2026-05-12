// utils/searchEngine.ts

// ============================================
// TYPES
// ============================================

enum MatchTier {
   EXACT_WORD = 5,
   WORD_START = 4,
   WORD_CONTAINS = 3,
   TYPO_SIMILAR = 2,
   CHAR_MATCH = 1
}

interface WordWithPosition {
   word: string;
   start: number;
   end: number;
}

interface ProcessedItem {
   original: any;
   nameLower: string;
   words: WordWithPosition[];
   popularity: number; // from order frequency
}

interface MatchResult {
   isMatch: boolean;
   tier: MatchTier;
   fineScore: number;
   positions: number[];
}

interface SearchResult {
   item: any;
   score: number;
   positions: number[];
}

// Cache for search results
const searchCache = new Map<string, SearchResult[]>();

// ============================================
// 1. PREPROCESSING (with word positions)
// ============================================

export const preprocessItems = (items: any[], popularityMap?: Map<string, number>): ProcessedItem[] => {
   return items.map(item => {
      const nameLower = item.name.toLowerCase();
      const words: WordWithPosition[] = [];

      // Split into words with positions
      const wordMatches = nameLower.matchAll(/\S+/g);
      for (const match of wordMatches) {
         words.push({
            word: match[0],
            start: match.index!,
            end: match.index! + match[0].length
         });
      }

      return {
         original: item,
         nameLower,
         words,
         popularity: popularityMap?.get(item.id) || 0
      };
   });
};

// ============================================
// 2. FAST LEVENSHTEIN (optimized)
// ============================================

const getEditDistance = (a: string, b: string, maxDistance: number = 2): number => {
   if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
   if (a[0] !== b[0] && a[0] !== b[1] && a[1] !== b[0]) {
      if (a.length > 2 && b.length > 2) return maxDistance + 1;
   }

   const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));

   for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
   for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

   for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
         const cost = a[i - 1] === b[j - 1] ? 0 : 1;
         matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1,
            matrix[j - 1][i - 1] + cost
         );
      }
   }

   return matrix[b.length][a.length];
};

// ============================================
// 3. ORDERED CHARACTER MATCH (with positions)
// ============================================

const orderedCharMatch = (text: string, search: string): { matched: boolean; positions: number[] } => {
   const positions: number[] = [];
   let searchIdx = 0;

   for (let i = 0; i < text.length && searchIdx < search.length; i++) {
      if (text[i] === search[searchIdx]) {
         positions.push(i);
         searchIdx++;
      }
   }

   return {
      matched: searchIdx === search.length,
      positions
   };
};

// ============================================
// 4. WORD SCORING (with positions)
// ============================================

const scoreWord = (wordInfo: WordWithPosition, searchWord: string): MatchResult | null => {
   const word = wordInfo.word;
   const searchLower = searchWord.toLowerCase();

   // TIER 5: Exact word match
   if (word === searchLower) {
      return {
         isMatch: true,
         tier: MatchTier.EXACT_WORD,
         fineScore: 100,
         positions: Array.from({ length: word.length }, (_, i) => wordInfo.start + i)
      };
   }

   // TIER 4: Word starts with search
   if (word.startsWith(searchLower)) {
      const positions = Array.from({ length: searchLower.length }, (_, i) => wordInfo.start + i);
      return {
         isMatch: true,
         tier: MatchTier.WORD_START,
         fineScore: 80,
         positions
      };
   }

   // TIER 3: Word contains search
   const containsIndex = word.indexOf(searchLower);
   if (containsIndex !== -1) {
      const positions = Array.from({ length: searchLower.length }, (_, i) => wordInfo.start + containsIndex + i);
      return {
         isMatch: true,
         tier: MatchTier.WORD_CONTAINS,
         fineScore: 60,
         positions
      };
   }

   // TIER 2: Typo similar
   if (Math.abs(word.length - searchLower.length) <= 2) {
      const distance = getEditDistance(word, searchLower, 2);
      const maxLen = Math.max(word.length, searchLower.length);
      const similarity = 1 - (distance / maxLen);

      if (similarity > 0.6) {
         // Approximate positions for typos (use first matching approach)
         const charMatch = orderedCharMatch(word, searchLower);
         const positions = charMatch.positions.map(pos => wordInfo.start + pos);
         return {
            isMatch: true,
            tier: MatchTier.TYPO_SIMILAR,
            fineScore: 40 * similarity,
            positions
         };
      }
   }

   // TIER 1: Characters in order
   const charMatch = orderedCharMatch(word, searchLower);
   if (charMatch.matched) {
      const positions = charMatch.positions.map(pos => wordInfo.start + pos);
      return {
         isMatch: true,
         tier: MatchTier.CHAR_MATCH,
         fineScore: 20,
         positions
      };
   }

   return null;
};

// ============================================
// 5. MULTI-WORD SEARCH (relaxed: allow 1 weak word)
// ============================================

export const searchItems = (
   processedItems: ProcessedItem[],
   searchQuery: string,
   currentCategory?: string
): SearchResult[] => {
   if (!searchQuery.trim()) {
      return processedItems.map(p => ({
         item: p.original,
         score: p.popularity,
         positions: []
      }));
   }

   // Check cache
   const cacheKey = `${searchQuery}|${currentCategory || 'all'}`;
   if (searchCache.has(cacheKey)) {
      return searchCache.get(cacheKey)!;
   }

   const searchWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 0);
   const results: SearchResult[] = [];

   for (const processed of processedItems) {
      let bestTier = MatchTier.CHAR_MATCH;
      let totalFineScore = 0;
      let allPositions: number[] = [];
      let weakWordCount = 0;
      let matchedWordsCount = 0;

      // Check each search word
      for (const searchWord of searchWords) {
         let bestMatchForWord: MatchResult | null = null;

         // Try matching against each word in item
         for (const itemWord of processed.words) {
            const match = scoreWord(itemWord, searchWord);
            if (match && match.isMatch) {
               if (!bestMatchForWord || match.tier > bestMatchForWord.tier) {
                  bestMatchForWord = match;
               }
            }
         }

         // Also try full name match
         if (!bestMatchForWord) {
            const fakeWordInfo: WordWithPosition = {
               word: processed.nameLower,
               start: 0,
               end: processed.nameLower.length
            };
            const fullMatch = scoreWord(fakeWordInfo, searchWord);
            if (fullMatch && fullMatch.isMatch) {
               bestMatchForWord = fullMatch;
            }
         }

         if (!bestMatchForWord) {
            matchedWordsCount = 0;
            break;
         }

         matchedWordsCount++;

         // Count weak matches (tier 1 = CHAR_MATCH)
         if (bestMatchForWord.tier === MatchTier.CHAR_MATCH) {
            weakWordCount++;
         }

         // Track weakest tier
         if (bestMatchForWord.tier < bestTier) {
            bestTier = bestMatchForWord.tier;
         }

         totalFineScore += bestMatchForWord.fineScore;
         allPositions.push(...bestMatchForWord.positions);
      }

      // Relaxed rule: ALL words must match, allow 1 weak word
      if (matchedWordsCount !== searchWords.length) continue;
      if (weakWordCount > 1) continue;

      // Calculate final score: TIER * 1000 + fineScore + popularity
      const tierScore = bestTier * 1000;
      const popularityBoost = processed.popularity * 5;

      // Category boost (additive, not multiplicative)
      let categoryBoost = 0;
      if (currentCategory && processed.original.category === currentCategory) {
         categoryBoost = 300;
      }

      const finalScore = tierScore + totalFineScore + popularityBoost + categoryBoost;

      results.push({
         item: processed.original,
         score: finalScore,
         positions: [...new Set(allPositions)] // Remove duplicates
      });
   }

   // Sort by score (highest first)
   results.sort((a, b) => b.score - a.score);

   // Cache results
   searchCache.set(cacheKey, results.slice(0, 50));

   // Clean cache if too large (keep last 100 queries)
   if (searchCache.size > 100) {
      const firstKey = searchCache.keys().next().value;
      searchCache.delete(firstKey);
   }

   return results.slice(0, 50);
};

// ============================================
// 6. HIGHLIGHTING (with correct positions)
// ============================================

export const highlightFromPositions = (text: string, positions: number[]): React.ReactNode => {
   if (!positions || positions.length === 0) return text;

   const sortedPositions = [...new Set(positions)].sort((a, b) => a - b);
   const result: React.ReactNode[] = [];
   let lastIndex = 0;

   for (const pos of sortedPositions) {
      if (pos < 0 || pos >= text.length) continue;

      if (pos > lastIndex) {
         result.push(text.substring(lastIndex, pos));
      }
      result.push(
         <mark key={pos} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {text[pos]}
         </mark>
      );
      lastIndex = pos + 1;
   }

   if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
   }

   return result;
};

// ============================================
// 7. SUGGESTION ENGINE (for empty states)
// ============================================

export const getSearchSuggestions = (
   processedItems: ProcessedItem[],
   failedQuery: string
): string[] => {
   const queryLower = failedQuery.toLowerCase();
   const suggestions: { word: string; distance: number }[] = [];

   // Collect unique words from menu
   const allWords = new Set<string>();
   for (const item of processedItems) {
      for (const wordInfo of item.words) {
         if (wordInfo.word.length > 3) {
            allWords.add(wordInfo.word);
         }
      }
   }

   // Find closest words
   for (const word of allWords) {
      if (Math.abs(word.length - queryLower.length) <= 2) {
         const distance = getEditDistance(word, queryLower, 3);
         if (distance <= 2) {
            suggestions.push({ word, distance });
         }
      }
   }

   suggestions.sort((a, b) => a.distance - b.distance);
   return suggestions.slice(0, 3).map(s => s.word);
};