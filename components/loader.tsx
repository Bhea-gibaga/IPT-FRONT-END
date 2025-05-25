const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent border-r-transparent rounded-lg animate-spin"></div>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Loader;
