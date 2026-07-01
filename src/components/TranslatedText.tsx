/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { translateText } from '../utils/translator';

interface TranslatedTextProps {
  text: string;
  to?: 'English' | 'Mandarin Chinese' | 'Spanish' | 'Vietnamese';
  className?: string;
  fallbackToText?: boolean;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  text, 
  to = 'English', 
  className = "",
  fallbackToText = true
}) => {
  const [translated, setTranslated] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // If the target language is English, just show original text
    if (!to || to === 'English') {
      setTranslated('');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    translateText(text, to)
      .then((res) => {
        if (isMounted) {
          setTranslated(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Translation failed", err);
        if (isMounted) {
          setTranslated(fallbackToText ? text : '');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [text, to, fallbackToText]);

  if (!to || to === 'English') {
    return null;
  }

  if (loading && !translated) {
    return <span className={`opacity-50 text-[11px] animate-pulse ${className}`}>Translating...</span>;
  }

  if (!translated || translated === text) {
    return null; // Don't redundantly display the same text twice
  }

  return (
    <span className={`block text-[11px] font-sans font-medium text-amber-500/85 mt-0.5 leading-relaxed italic ${className}`}>
      {translated}
    </span>
  );
};
