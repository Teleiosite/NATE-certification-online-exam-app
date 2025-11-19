import React, { useState, useEffect } from 'react';
import { Question, QuestionType, QuestionOption } from '../types';

interface QuestionEditorProps {
    question: Partial<Question> | null;
    onSave: (question: Partial<Question>) => void;
    onCancel: () => void;
    onDelete?: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onSave, onCancel, onDelete }) => {
    const [editedQuestion, setEditedQuestion] = useState<Partial<Question>>({});
    
    useEffect(() => {
        setEditedQuestion(question || { questionType: QuestionType.MultipleChoice, points: 5, options: [] });
    }, [question]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditedQuestion({ ...editedQuestion, text: e.target.value });
    };
    
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as QuestionType;
        const updatedQuestion: Partial<Question> = { ...editedQuestion, questionType: newType };
        
        // Ensure options array exists for relevant types
        if(newType === QuestionType.MultipleChoice || newType === QuestionType.MultipleSelect) {
            if(!updatedQuestion.options || updatedQuestion.options.length === 0) {
                updatedQuestion.options = [
                    { id: `o-${Date.now()}-1`, text: '', isCorrect: false },
                    { id: `o-${Date.now()}-2`, text: '', isCorrect: false }
                ];
            }
        } else {
            // Options are not needed for other types
            delete updatedQuestion.options;
            delete updatedQuestion.correctAnswer;
        }
        setEditedQuestion(updatedQuestion);
    };

    const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedQuestion({ ...editedQuestion, points: parseInt(e.target.value) || 0 });
    };
    
    const handleOptionChange = (index: number, newText: string) => {
        const newOptions = [...(editedQuestion.options || [])];
        newOptions[index].text = newText;
        setEditedQuestion({ ...editedQuestion, options: newOptions });
    };

    const handleCorrectOptionChange = (optionId: string) => {
        let newOptions: QuestionOption[] = [];
        let newCorrectAnswer: string | string[] | undefined;

        if (editedQuestion.questionType === QuestionType.MultipleChoice) {
            newOptions = (editedQuestion.options || []).map(opt => ({
                ...opt,
                isCorrect: opt.id === optionId,
            }));
            newCorrectAnswer = optionId;
        } else if (editedQuestion.questionType === QuestionType.MultipleSelect) {
            newOptions = (editedQuestion.options || []).map(opt => 
                opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
            );
            newCorrectAnswer = newOptions.filter(opt => opt.isCorrect).map(opt => opt.id);
        }
        
        setEditedQuestion({ ...editedQuestion, options: newOptions, correctAnswer: newCorrectAnswer });
    };
    
    const handleAddOption = () => {
         const newOptions = [...(editedQuestion.options || []), { id: `o-${Date.now()}`, text: '', isCorrect: false }];
         setEditedQuestion({ ...editedQuestion, options: newOptions });
    };

    const handleRemoveOption = (id: string) => {
        const newOptions = (editedQuestion.options || []).filter(opt => opt.id !== id);
        setEditedQuestion({ ...editedQuestion, options: newOptions });
    };
    
    const isSaveDisabled = !editedQuestion.text || (editedQuestion.points || 0) <= 0;

    const renderOptionsEditor = () => {
        if (editedQuestion.questionType !== QuestionType.MultipleChoice && editedQuestion.questionType !== QuestionType.MultipleSelect) return null;

        const inputType = editedQuestion.questionType === QuestionType.MultipleChoice ? 'radio' : 'checkbox';

        return (
            <div className="space-y-3">
                <h4 className="font-semibold text-gray-300">Options</h4>
                <p className="text-xs text-gray-400">Select the correct answer(s).</p>
                {(editedQuestion.options || []).map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-2">
                        <input 
                          type={inputType} 
                          name="correct-option" 
                          checked={option.isCorrect} 
                          onChange={() => handleCorrectOptionChange(option.id)} 
                          className={`h-5 w-5 text-sky-500 bg-gray-700 border-gray-600 focus:ring-sky-500 ${inputType === 'checkbox' ? 'rounded' : ''}`} 
                        />
                        <input type="text" value={option.text} onChange={e => handleOptionChange(index, e.target.value)} placeholder={`Option ${index + 1}`} className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100" />
                        <button onClick={() => handleRemoveOption(option.id)} className="p-2 text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
                    </div>
                ))}
                <button onClick={handleAddOption} className="text-sm text-sky-400 hover:text-sky-300 font-semibold">+ Add Option</button>
            </div>
        )
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={onCancel}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6 flex-shrink-0">{editedQuestion.id ? 'Edit Question' : 'Add New Question'}</h2>
                
                <div className="space-y-4 flex-grow overflow-y-auto pr-4">
                     <div>
                        <label className="text-sm font-semibold text-gray-400">Question Type</label>
                        <select value={editedQuestion.questionType} onChange={handleTypeChange} className="mt-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100">
                           <option value={QuestionType.MultipleChoice}>Multiple Choice</option>
                           <option value={QuestionType.MultipleSelect}>Multiple Select</option>
                           <option value={QuestionType.ShortAnswer}>Short Answer</option>
                           <option value={QuestionType.Essay}>Essay</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-400">Question Text</label>
                        <textarea value={editedQuestion.text || ''} onChange={handleTextChange} rows={3} className="mt-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100" placeholder="e.g., What is the capital of France?"></textarea>
                    </div>
                     <div>
                        <label className="text-sm font-semibold text-gray-400">Points</label>
                        <input type="number" value={editedQuestion.points || ''} onChange={handlePointsChange} className="mt-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100" placeholder="e.g., 5" />
                    </div>
                    
                    {renderOptionsEditor()}
                </div>

                <div className="mt-8 flex justify-between items-center flex-shrink-0">
                    <div>
                        {onDelete && <button onClick={onDelete} className="px-4 py-2 rounded-md bg-red-800 hover:bg-red-700 text-white font-semibold transition">Delete</button>}
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition">Cancel</button>
                        <button onClick={() => onSave(editedQuestion)} disabled={isSaveDisabled} className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed">Save Question</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionEditor;