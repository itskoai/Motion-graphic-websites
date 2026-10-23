// Lab route for the Story scene builder: renders only this scene with scroll room before and after. Not linked; removed before deploy.
import { Story } from '@/components/scenes/Story';
export default function Lab() {
  return (
    <>
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}><p className="kicker">(scene above)</p></div>
      <Story />
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}><p className="kicker">(scene below)</p></div>
    </>
  );
}
