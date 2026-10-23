// Lab route for the Final scene builder: renders only this scene with scroll room before and after. Not linked; removed before deploy.
import { Final } from '@/components/scenes/Final';
export default function Lab() {
  return (
    <>
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}><p className="kicker">(scene above)</p></div>
      <Final />
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}><p className="kicker">(scene below)</p></div>
    </>
  );
}
