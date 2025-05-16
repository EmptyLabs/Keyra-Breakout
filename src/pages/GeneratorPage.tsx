import React from 'react';
import PasswordGeneratorForm from '../components/generator/PasswordGeneratorForm';
import { Wand2 } from 'lucide-react';

const GeneratorPage: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <Wand2 className="w-6 h-6 mr-2 text-[#a6ccb8]" />
          Password Generator
        </h1>
        <p className="text-[#546e7a]">
          Create strong, unique passwords for enhanced security
        </p>
      </div>
      
      <div className="max-w-2xl">
        <PasswordGeneratorForm />
      </div>
    </div>
  );
};

export default GeneratorPage;