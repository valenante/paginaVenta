import useRevealOnScroll from '../../hooks/useRevealOnScroll';

const ScrollRevealWrapper = ({ children }) => {
  const [ref, visible] = useRevealOnScroll();

  return (
    <div ref={ref} className={`reveal ${visible ? 'visible' : ''}`}>
      {children}
    </div>
  );
};

export default ScrollRevealWrapper;
