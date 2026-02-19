import React from 'react';

const Banner: React.FC = () => {
  return (
    <div className="bg-violet-500 text-white w-full py-4 text-center">
      <p>
        🎉 Ready to launch your business online?{' '}
        <a href="/dashboard/new" className="underline font-semibold">
          Start building with Flowstarter today
        </a>
      </p>
    </div>
  );
};

export default Banner;
