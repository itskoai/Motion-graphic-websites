// Lab route for the Coming scene builder: renders only this scene with scroll room before and after. Not linked; removed before deploy.
import { Coming } from '@/components/scenes/Coming';
export default function Lab() {
  return (
    <>
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}><p className="kicker">(scene above)</p></div>
      <Coming />
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}><p className="kicker">(scene below)</p></div>
    </>
  );
}
