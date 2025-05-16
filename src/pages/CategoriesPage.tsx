import React from 'react';
import CategoryList from '../components/categories/CategoryList';

const CategoriesPage: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Categories</h1>
        <p className="text-[#546e7a]">
          Organize your passwords into different categories
        </p>
      </div>
      
      <div className="max-w-2xl">
        <CategoryList />
      </div>
    </div>
  );
};

export default CategoriesPage;