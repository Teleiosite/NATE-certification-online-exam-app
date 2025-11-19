import React from 'react';
import { nateLogo } from '../assets/nate-logo';
import { certificateBg } from '../assets/certificate-bg';

interface CertificateProps {
  studentName: string;
  examTitle: string;
  completionDate: string;
  onBack: () => void;
}

const Certificate: React.FC<CertificateProps> = ({ studentName, examTitle, completionDate, onBack }) => {
  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl no-print">
        <header className="flex items-center justify-between mb-8">
            <button onClick={onBack} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold text-white">
                &larr; Back to Dashboard
            </button>
            <button onClick={handleDownload} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Download Certificate</span>
            </button>
        </header>
      </div>

      {/* A4 Landscape Aspect Ratio */}
      <div 
        id="certificate" 
        className="certificate-container bg-white text-gray-800 rounded-lg shadow-2xl w-full max-w-5xl aspect-[1.414/1] relative overflow-hidden"
      >
        <img src={certificateBg} alt="Certificate Background" className="absolute top-0 left-0 w-full h-full object-cover opacity-50 z-0"/>
        
        <div className="absolute top-0 left-0 w-full h-full border-[12px] border-sky-900 box-border"></div>
        <div className="absolute top-3 left-3 w-[calc(100%-24px)] h-[calc(100%-24px)] border-2 border-amber-400 box-border"></div>

        <div className="relative z-10 p-12 h-full flex flex-col justify-between items-center text-center">
            
            <div className="flex items-center space-x-4">
                <img src={nateLogo} alt="NATE Logo" className="w-20 h-20 md:w-24 md:h-24"/>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-sky-900 tracking-wider">NIGERIAN ASSOCIATION OF TECHNOLOGISTS IN ENGINEERING</h1>
                    <p className="text-md md:text-lg font-semibold text-gray-600">CERTIFICATION PLATFORM</p>
                </div>
            </div>

            <div>
                <p className="text-lg md:text-xl text-gray-700 font-medium tracking-widest uppercase">Certificate of Completion</p>
                <div className="w-48 h-0.5 bg-gray-300 mx-auto my-4"></div>
                <p className="text-md md:text-lg mt-2 text-gray-600">This is to certify that</p>
                <p className="text-4xl md:text-5xl font-serif text-sky-800 my-6" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.1)'}}>{studentName}</p>
                <p className="text-md md:text-lg text-gray-600">has successfully completed the examination for</p>
                <h2 className="text-2xl md:text-3xl font-semibold my-2 text-gray-800">{examTitle}</h2>
                <p className="text-sm md:text-md text-gray-500">Awarded on this day, {completionDate}</p>
            </div>
            
            <div className="w-full mt-16 flex justify-around items-end text-sm text-gray-700">
                <div className="w-1/3">
                    <p className="border-t-2 border-gray-400 pt-2 font-semibold">President</p>
                </div>
                 <div className="text-center">
                    <div className="w-20 h-20 bg-red-800/80 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ boxShadow: '0 0 10px rgba(0,0,0,0.3)'}}>
                        SEAL
                    </div>
                </div>
                <div className="w-1/3">
                    <p className="border-t-2 border-gray-400 pt-2 font-semibold">Registrar</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
