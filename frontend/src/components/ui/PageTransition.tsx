import { useLocation } from 'react-router-dom';

const fadeInUpStyle: React.CSSProperties = {
  animation: 'fadeInUp 0.4s ease-out both',
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} style={fadeInUpStyle}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {children}
    </div>
  );
}
