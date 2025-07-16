import React, { useState } from 'react'

const Tags = ({ tags, setTags, maxTags = 10 }) => {
    const [tagInput, setTagInput] = useState('')

    const addTag = (e) => {
        e.preventDefault()
        
        const newTag = tagInput.trim().toLowerCase()
        
        if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
            setTags([...tags, newTag])
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag(e)
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            removeTag(tags[tags.length - 1])
        }
    }

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                Tags ({tags.length}/{maxTags})
            </label>
            
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-yellow-300 focus-within:border-transparent">
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-yellow-300 text-yellow-400 text-sm rounded-full"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-yellow-300 hover:text-yellow-400 focus:outline-none"
                        >
                            ×
                        </button>
                    </span>
                ))}
                
                {tags.length < maxTags && (
                    <form onSubmit={addTag} className="inline-flex">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={tags.length === 0 ? "Add tags..." : ""}
                            className="outline-none text-sm min-w-[100px]"
                            maxLength={20}
                        />
                    </form>
                )}
            </div>
            
            <p className="text-xs text-gray-500">
                Press Enter to add a tag. Tags help readers find your story.
            </p>
        </div>
    )
}

export default Tags
