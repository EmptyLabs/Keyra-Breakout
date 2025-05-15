import React, { useState } from 'react';
import { usePassword, Category } from '../../context/PasswordContext';
import { FolderPlus, Edit2, Trash, Check, X, AlertCircle } from 'lucide-react';

const CategoryList: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = usePassword();
  const [newCategory, setNewCategory] = useState('');
  const [newIcon, setNewIcon] = useState('folder');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [error, setError] = useState('');

  const availableIcons = [
    'folder', 'key', 'credit-card', 'file-text', 'mail', 
    'shopping-bag', 'shield', 'smartphone', 'globe', 'wifi'
  ];

  const iconComponents: Record<string, JSX.Element> = {
    folder: <FolderPlus size={18} />,
    // Import other icons as needed from lucide-react
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    const success = addCategory({
      name: newCategory.trim(),
      icon: newIcon
    });

    if (success) {
      setNewCategory('');
      setNewIcon('folder');
      setIsAdding(false);
      setError('');
    } else {
      setError('Failed to add category');
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    if (editingId) {
      const success = updateCategory(editingId, {
        name: editName.trim(),
        icon: editIcon
      });

      if (success) {
        setEditingId(null);
        setEditName('');
        setEditIcon('');
        setError('');
      } else {
        setError('Failed to update category');
      }
    }
  };

  const handleDelete = (id: string) => {
    const success = deleteCategory(id);
    if (!success) {
      setError('Cannot delete default categories');
      setTimeout(() => setError(''), 3000);
    }
  };

  const renderCategoryRow = (category: Category) => {
    const isEditing = editingId === category.id;
    const isDefault = ['passwords', 'credit-cards', 'notes'].includes(category.id);

    if (isEditing) {
      return (
        <div key={category.id} className="flex items-center border-b border-gray-200 py-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="input-field mr-2 flex-1"
          />
          
          <div className="flex space-x-2">
            <button
              onClick={handleSaveEdit}
              className="p-1 text-[#2ecc71] hover:bg-green-50 rounded-md"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="p-1 text-[#e74c3c] hover:bg-red-50 rounded-md"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={category.id} className="flex items-center justify-between border-b border-gray-200 py-3 animate-fade-in">
        <div className="flex items-center">
          {/* Display the icon (in a real implementation, use dynamic icons) */}
          <div className="w-8 h-8 bg-[#a6ccb8] bg-opacity-20 rounded-md flex items-center justify-center mr-3">
            <FolderPlus size={18} className="text-[#a6ccb8]" />
          </div>
          <span className="font-medium">{category.name}</span>
        </div>
        
        <div className="flex space-x-2">
          {!isDefault && (
            <>
              <button
                onClick={() => handleStartEdit(category)}
                className="p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-md"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="p-1 text-gray-500 hover:bg-gray-100 hover:text-[#e74c3c] rounded-md"
              >
                <Trash size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Categories</h2>
        <p className="text-[#546e7a] text-sm">
          Organize your passwords into different categories
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-[#e74c3c] rounded-md flex items-center animate-fade-in">
          <AlertCircle size={18} className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="space-y-1">
        {categories.map(renderCategoryRow)}
      </div>
      
      {isAdding ? (
        <div className="mt-4 border-t border-gray-200 pt-4 animate-fade-in">
          <div className="flex items-center mb-3">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              className="input-field flex-1 mr-2"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddCategory}
                className="p-1 text-[#2ecc71] hover:bg-green-50 rounded-md"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewCategory('');
                  setError('');
                }}
                className="p-1 text-[#e74c3c] hover:bg-red-50 rounded-md"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-4 btn-primary"
        >
          <FolderPlus size={18} className="mr-2" />
          Add New Category
        </button>
      )}
    </div>
  );
};

export default CategoryList;