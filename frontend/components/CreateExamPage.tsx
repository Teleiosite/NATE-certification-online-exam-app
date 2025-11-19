import React, { useState, useMemo, ChangeEvent } from 'react';
import { Exam, Question, QuestionType, QuestionBank, EngineeringDepartment } from '../types';
import QuestionEditor from './QuestionEditor';


interface CreateExamPageProps {
    exam: Exam;
    onExamChange: (exam: Exam) => void;
    questionBank: QuestionBank;
    onUpdateQuestionBank: React.Dispatch<React.SetStateAction<QuestionBank>>;
}


const CsvImportActionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    questionCount: number;
    onSaveToBank: () => void;
    onAddToExam: () => void;
}> = ({ isOpen, onClose, questionCount, onSaveToBank, onAddToExam }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">CSV Import Successful</h2>
                <p className="text-gray-300 mb-6">Found {questionCount} questions in the file. What would you like to do with them?</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">Cancel</button>
                    <button onClick={onSaveToBank} className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold">Save to Question Bank</button>
                    <button onClick={onAddToExam} className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white font-semibold">Add Directly to Exam</button>
                </div>
            </div>
        </div>
    )
}


const QuestionBankModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (selectedQuestions: Question[]) => void;
    bank: QuestionBank;
}> = ({ isOpen, onClose, onImport, bank }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const handleToggle = (qId: string) => {
        setSelected(prev => {
            const newSet = new Set(prev);
            if (newSet.has(qId)) newSet.delete(qId);
            else newSet.add(qId);
            return newSet;
        });
    };
    
    const handleImport = () => {
        const questionsToImport = bank.filter(q => selected.has(q.id));
        onImport(questionsToImport);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">Import from Question Bank</h2>
                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                    {bank.map(q => (
                        <div key={q.id} onClick={() => handleToggle(q.id)} className={`p-3 rounded-lg border-2 cursor-pointer ${selected.has(q.id) ? 'bg-sky-900/50 border-sky-500' : 'bg-gray-700 border-gray-600'}`}>
                            <p className="font-semibold">{q.text}</p>
                            <p className="text-xs text-gray-400">{q.questionType.replace(/_/g, ' ')} - {q.points} points</p>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">Cancel</button>
                    <button onClick={handleImport} className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold">{`Import ${selected.size} Question(s)`}</button>
                </div>
            </div>
        </div>
    );
};


const CreateExamPage: React.FC<CreateExamPageProps> = ({ exam, onExamChange, questionBank, onUpdateQuestionBank }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [draggedItem, setDraggedItem] = useState<Question | null>(null);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [parsedCsvQuestions, setParsedCsvQuestions] = useState<Question[]>([]);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  
  const totalPoints = useMemo(() => exam.questions.reduce((sum, q) => sum + q.points, 0), [exam.questions]);

  const handleOpenEditorForNew = () => {
    setEditingQuestion({
        questionType: QuestionType.MultipleChoice, // default type
        points: 5,
        orderIndex: exam.questions.length,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEditorForEdit = (question: Question) => {
    setEditingQuestion(question);
    setIsEditorOpen(true);
  };
  
  const handleSaveQuestion = (questionToSave: Partial<Question>) => {
    const newQuestions = [...exam.questions];
    if(questionToSave.id) { // Existing question
        const index = newQuestions.findIndex(q => q.id === questionToSave.id);
        if(index !== -1) {
            newQuestions[index] = questionToSave as Question;
        }
    } else { // New question
         const newQuestion: Question = {
            ...questionToSave,
            id: `q-${Date.now()}`,
         } as Question;
         newQuestions.push(newQuestion);
    }
    const updatedExam = { ...exam, questions: newQuestions.sort((a,b) => a.orderIndex - b.orderIndex) };
    onExamChange(updatedExam);
    setIsEditorOpen(false);
    setEditingQuestion(null);
  };
  
  const handleDeleteQuestion = (questionId: string) => {
    const updatedExam = {
        ...exam,
        questions: exam.questions.filter(q => q.id !== questionId)
            .map((q, index) => ({...q, orderIndex: index})) // Re-index
    };
    onExamChange(updatedExam);
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, question: Question) => {
    setDraggedItem(question);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetQuestion: Question) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetQuestion.id) {
      setDraggedItem(null);
      return;
    }

    const reorderedQuestions = [...exam.questions];
    const draggedIndex = reorderedQuestions.findIndex(q => q.id === draggedItem.id);
    const targetIndex = reorderedQuestions.findIndex(q => q.id === targetQuestion.id);

    // Remove the dragged item and insert it at the target's position
    const [removed] = reorderedQuestions.splice(draggedIndex, 1);
    reorderedQuestions.splice(targetIndex, 0, removed);

    // Update orderIndex for all questions
    const finalQuestions = reorderedQuestions.map((q, index) => ({ ...q, orderIndex: index }));
    
    const updatedExam = { ...exam, questions: finalQuestions };
    onExamChange(updatedExam);
    setDraggedItem(null);
  };

  const handleImportFromBank = (importedQuestions: Question[]) => {
    const existingIds = new Set(exam.questions.map(q => q.id));
    const newQuestions = importedQuestions.filter(q => !existingIds.has(q.id));
    const allQuestions = [...exam.questions, ...newQuestions].map((q, index) => ({...q, id: `q-${Date.now()}-${index}`, orderIndex: index}));
    onExamChange({ ...exam, questions: allQuestions });
  };

  const handleCsvImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const questions: Question[] = [];
        const rows = text.split('\n').slice(1); // skip header
        rows.forEach(row => {
            if (row.trim() === '') return;
            const [text, type, points, ...optionsText] = row.split(',');
            const questionType = type as QuestionType;
            let options: any[] = [];
            let correctAnswer: any = undefined;

            if (questionType === QuestionType.MultipleChoice || questionType === QuestionType.MultipleSelect) {
                options = optionsText.map(optStr => {
                    const isCorrect = optStr.endsWith('*');
                    const text = isCorrect ? optStr.slice(0, -1) : optStr;
                    return { id: `o-${Date.now()}-${Math.random()}`, text, isCorrect };
                });
                const correctOptions = options.filter(o => o.isCorrect).map(o => o.id);
                correctAnswer = questionType === QuestionType.MultipleChoice ? correctOptions[0] : correctOptions;
            }

            questions.push({
                id: `q-${Date.now()}-${Math.random()}`,
                text,
                questionType,
                points: parseInt(points),
                options,
                correctAnswer,
                orderIndex: 0 // will be re-indexed
            });
        });
        setParsedCsvQuestions(questions);
        setIsCsvModalOpen(true);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };
  
  const handleDownloadSampleCsv = () => {
    const csvContent = [
      "text,question_type,points,option1,option2,option3,option4",
      '"Which hook is used for side effects?",multiple_choice,10,useState,useEffect*,useContext,useReducer',
      '"Explain the purpose of the Virtual DOM.",essay,15',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'exam_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCsvToExam = () => {
    const allQuestions = [...exam.questions, ...parsedCsvQuestions].map((q, index) => ({...q, orderIndex: index}));
    onExamChange({ ...exam, questions: allQuestions });
    setIsCsvModalOpen(false);
    setParsedCsvQuestions([]);
  };

  const handleAddCsvToBank = () => {
    onUpdateQuestionBank(prevBank => {
        const bankTexts = new Set(prevBank.map(q => q.text));
        const newQuestions = parsedCsvQuestions.filter(q => !bankTexts.has(q.text));
        return [...prevBank, ...newQuestions];
    });
    setIsCsvModalOpen(false);
    setParsedCsvQuestions([]);
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
        {/* Left Panel: Exam Settings */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 flex flex-col space-y-4 overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-200 border-b border-gray-600 pb-2">Exam Settings</h2>
            <div>
                <label className="text-sm font-semibold text-gray-400">Exam Title</label>
                <input type="text" value={exam.title} onChange={e => onExamChange({...exam, title: e.target.value})} className="mt-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100" />
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-400">Department</label>
                <select value={exam.department} onChange={e => onExamChange({...exam, department: e.target.value as EngineeringDepartment})} className="mt-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100">
                    {Object.values(EngineeringDepartment).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>
             <div>
                <label className="text-sm font-semibold text-gray-400">Duration (minutes)</label>
                <input type="number" value={exam.durationMinutes} onChange={e => onExamChange({...exam, durationMinutes: parseInt(e.target.value)})} className="mt-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100" />
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-400">Retake Limit</label>
                <input type="number" value={exam.retakeLimit} min="0" onChange={e => onExamChange({...exam, retakeLimit: parseInt(e.target.value)})} className="mt-1 w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100" />
            </div>
            <div className="space-y-2 pt-2">
                 <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="h-4 w-4 text-sky-500 bg-gray-700 border-gray-600 rounded" /> <span>Randomize Questions</span></label>
                 <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="h-4 w-4 text-sky-500 bg-gray-700 border-gray-600 rounded" /> <span>Enable Proctoring</span></label>
                 <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="h-4 w-4 text-sky-500 bg-gray-700 border-gray-600 rounded" /> <span>Browser Lockdown</span></label>
            </div>
        </div>

        {/* Right Panel: Questions */}
        <div className="w-full md:w-2/3 lg:w-3/4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 flex flex-col">
            <div className="flex-shrink-0 border-b border-gray-600 pb-4 mb-4">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-200">Questions ({exam.questions.length}) - {totalPoints} Points</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleOpenEditorForNew} className="px-4 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold transition">Add Manually</button>
                    </div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-dashed border-gray-600 text-center">
                    <h3 className="font-semibold text-gray-200">AI-Powered Question Generation</h3>
                    <p className="text-sm text-gray-400 mt-1">Automatically generate relevant questions for the <strong className="text-sky-400">{exam.department}</strong> department.</p>
                    <button className="mt-3 px-4 py-2 text-sm rounded-md bg-green-700 text-white font-semibold transition flex items-center justify-center mx-auto space-x-2 opacity-60 cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5 8a.5.5 0 01.5-.5h8a.5.5 0 010 1H5.5A.5.5 0 015 8zm.5 3.5a.5.5 0 000 1h4a.5.5 0 000-1h-4z" clipRule="evenodd" /><path d="M8.5 3.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5zM11.5 3.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5z" /></svg>
                        <span>Generate with AI (Coming Soon)</span>
                    </button>
                </div>
            </div>
             <div className="flex justify-end items-center space-x-2 mb-4">
                     <button onClick={() => setIsBankOpen(true)} className="px-4 py-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition">Import from Bank</button>
                     <label className="cursor-pointer px-4 py-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition">
                        Import from CSV
                        <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
                     </label>
                     <button onClick={handleDownloadSampleCsv} title="Download CSV template" className="p-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                     </button>
                </div>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                {exam.questions.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p>No questions yet. Click "Add Manually" or import to start.</p>
                    </div>
                )}
                {exam.questions.map((q, index) => (
                    <div 
                        key={q.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, q)}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, q)}
                        className={`bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center space-x-4 cursor-grab ${draggedItem?.id === q.id ? 'opacity-50' : ''}`}
                     >
                        <div className="text-gray-500" title="Drag to reorder">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        </div>
                        <div className="flex-grow">
                            <p className="font-semibold text-white">{index + 1}. {q.text}</p>
                            <p className="text-xs text-gray-400">{q.questionType.replace(/_/g, ' ')} - {q.points} points</p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleOpenEditorForEdit(q)} className="p-2 text-gray-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                            <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      {isEditorOpen && (
          <QuestionEditor
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onCancel={() => setIsEditorOpen(false)}
            onDelete={editingQuestion?.id ? () => { handleDeleteQuestion(editingQuestion.id!); setIsEditorOpen(false); } : undefined}
           />
      )}
      <QuestionBankModal 
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        onImport={handleImportFromBank}
        bank={questionBank}
      />
      <CsvImportActionModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        questionCount={parsedCsvQuestions.length}
        onSaveToBank={handleAddCsvToBank}
        onAddToExam={handleAddCsvToExam}
      />
    </div>
  );
};

export default CreateExamPage;