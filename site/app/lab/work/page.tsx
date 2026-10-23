// Lab route for the Work scene builder: renders only this scene with scroll room before and after. Not linked; removed before deploy.
import { Work } from '@/components/scenes/Work';
export default function Lab() {
  return (
    <>
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}><p className="kicker">(scene above)</p></div>
      <Work />
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}><p className="kicker">(scene below)</p></div>
    </>
  );
}
