import CelibacyTracker from '@/components/CelibacyTracker';

const Home = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed

  return <CelibacyTracker year={currentYear} month={currentMonth} />;
};

export default Home;
