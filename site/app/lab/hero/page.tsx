// Lab route for the Hero scene builder: renders only this scene with scroll room before and after. Not linked; removed before deploy.
import { Hero } from '@/components/scenes/Hero';
export default function Lab() {
  return (
    <>
      
      <Hero />
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}><p className="kicker">(scene below)</p></div>
    </>
  );
}
