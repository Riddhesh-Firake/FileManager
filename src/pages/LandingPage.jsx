import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, Lock, Zap, ShieldCheck, Users } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto bg-white">
      {/* Navigation */}
      <nav className="w-full py-6 px-4 md:px-12 lg:px-24 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-sm z-50 border-b-2 border-transparent">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12.0002 21.4142L17.4144 16H18.0002C20.2093 16 22.0002 14.2091 22.0002 12C22.0002 9.79086 20.2093 8 18.0002 8H12.0002V21.4142Z" fill="#191A23"/>
            <path d="M11.9998 2.58578L6.58557 8H5.99981C3.79067 8 1.99981 9.79086 1.99981 12C1.99981 14.2091 3.79067 16 5.99981 16H11.9998V2.58578Z" fill="#B9FF66"/>
          </svg>
          <span className="text-2xl font-bold tracking-tight">Positivus Drive</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hidden md:block hover:underline font-medium">Features</a>
          <a href="#" className="hidden md:block hover:underline font-medium">Pricing</a>
          <button 
            onClick={() => navigate('/login')} 
            className="px-6 py-2 border-2 border-[#191A23] rounded-xl hover:bg-[#B9FF66] transition shadow-none hover:shadow-[2px_2px_0_#191A23] font-bold"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="w-full px-4 md:px-12 lg:px-24 pt-12 pb-20 flex-1 flex items-center">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 w-full">
          <div className="lg:w-1/2 space-y-8">
            <h1 className="text-5xl md:text-7xl font-medium leading-tight">
              Organize your <br/> 
              <span className="bg-[#B9FF66] px-2 rounded-lg inline-block leading-[1.1] decoration-clone box-decoration-clone pb-1">digital chaos</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-lg">
              Secure, fast, and simple file management for teams that want to get things done without the clutter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/login')} 
                className="btn-anim-hover px-8 py-4 rounded-xl text-lg transition shadow-[4px_4px_0_#191A23] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#191A23] w-full sm:w-auto"
              >
                <span className="relative z-10">Get Started Free</span>
              </button>
              <button className="px-8 py-4 rounded-xl text-lg border-2 border-[#191A23] hover:bg-[#F3F3F3] transition w-full sm:w-auto">
                View Demo
              </button>
            </div>
          </div>
          
          {/* Abstract Illustration */}
          <div className="lg:w-1/2 flex justify-center relative">
            <div className="w-full max-w-md h-80 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#B9FF66] rounded-full border-2 border-[#191A23] flex items-center justify-center animate-bounce duration-[3000ms]">
                <CloudUpload size={32} strokeWidth={2.5} />
              </div>
              <div className="absolute bottom-0 left-10 w-20 h-20 bg-[#191A23] text-white rounded-xl flex items-center justify-center transform -rotate-12 z-10">
                <Lock size={32} strokeWidth={2.5} />
              </div>
              
              <div className="absolute top-10 left-0 right-10 bottom-10 bg-white border-2 border-[#191A23] rounded-2xl shadow-[4px_4px_0_#191A23] p-6 flex flex-col gap-4 z-0">
                <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg border border-[#191A23]"></div>
                  <div className="w-16 h-16 bg-red-100 rounded-lg border border-[#191A23]"></div>
                  <div className="w-16 h-16 bg-yellow-100 rounded-lg border border-[#191A23]"></div>
                </div>
                <div className="mt-auto h-2 bg-gray-100 rounded-full overflow-hidden border border-[#191A23]">
                  <div className="w-2/3 h-full bg-[#B9FF66]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Strip */}
      <section className="bg-[#191A23] text-white py-12 px-4 md:px-12 lg:px-24">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="flex items-start gap-4">
             <div className="p-3 bg-[#B9FF66] text-[#191A23] rounded-lg border border-white">
               <Zap size={24} strokeWidth={2.5} />
             </div>
             <div>
               <h3 className="font-bold text-xl mb-1">Lightning Fast</h3>
               <p className="text-gray-400">Upload and retrieve files in milliseconds.</p>
             </div>
           </div>
           <div className="flex items-start gap-4">
             <div className="p-3 bg-[#B9FF66] text-[#191A23] rounded-lg border border-white">
               <ShieldCheck size={24} strokeWidth={2.5} />
             </div>
             <div>
               <h3 className="font-bold text-xl mb-1">Bank-Grade Security</h3>
               <p className="text-gray-400">Your data is encrypted end-to-end.</p>
             </div>
           </div>
           <div className="flex items-start gap-4">
             <div className="p-3 bg-[#B9FF66] text-[#191A23] rounded-lg border border-white">
               <Users size={24} strokeWidth={2.5} />
             </div>
             <div>
               <h3 className="font-bold text-xl mb-1">Team Collaboration</h3>
               <p className="text-gray-400">Share files securely with a single link.</p>
             </div>
           </div>
         </div>
      </section>
    </div>
  );
};

export default LandingPage;