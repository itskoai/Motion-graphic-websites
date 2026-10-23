// Lab route for the Create scene builder: renders only this scene with scroll room before and after. Not linked; removed before deploy.
import { Create } from '@/components/scenes/Create';
export default function Lab() {
  return (
    <>
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}><p className="kicker">(scene above)</p></div>
      <Create />
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}><p className="kicker">(scene below)</p></div>
    </>
  );
}
