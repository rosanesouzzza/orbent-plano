import React, { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange, placeholder = 'Adicionar tags...' }) => {
    const [inputValue, setInputValue] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim().replace(/,/g, '');
            if (newTag && !tags.includes(newTag)) {
                onTagsChange([...tags, newTag]);
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const removeTag = (indexToRemove: number) => {
        onTagsChange(tags.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="flex flex-wrap items-center w-full p-1.5 border border-border-color rounded-lg shadow-sm bg-white focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
            {tags.map((tag, index) => (
                <span key={index} className="flex items-center bg-primary-light text-primary-text text-xs font-semibold mr-2 my-1 px-2.5 py-1 rounded-full">
                    {tag}
                    <button
                        type="button"
                        className="ml-1.5 -mr-1 flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary-text/70 hover:bg-primary/20 hover:text-primary-text focus:outline-none focus:bg-primary/30"
                        onClick={() => removeTag(index)}
                    >
                        <span className="sr-only">Remove {tag}</span>
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                        </svg>
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={tags.length === 0 ? placeholder : ''}
                className="flex-grow bg-transparent border-none focus:ring-0 text-sm p-1 my-1 min-w-[120px]"
            />
        </div>
    );
};