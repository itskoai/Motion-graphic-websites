import { Hero } from '@/components/scenes/Hero';
import { Create } from '@/components/scenes/Create';
import { Story } from '@/components/scenes/Story';
import { Work } from '@/components/scenes/Work';
import { Creators } from '@/components/scenes/Creators';
import { Process } from '@/components/scenes/Process';
import { Coming } from '@/components/scenes/Coming';
import { Final } from '@/components/scenes/Final';

export default function Page() {
  return (
    <>
      <Hero />
      <Create />
      <Story />
      <Work />
      <Creators />
      <Process />
      <Coming />
      <Final />
    </>
  );
}
