import Loader from '@src/repl/components/Loader';
import { HorizontalPanel, VerticalPanel } from '@src/repl/components/panel/Panel';
import { Code } from '@src/repl/components/Code';
import StatusBar from '@src/repl/components/StatusBar';
import { Header } from './Header';
import MadaMixBar from './madamix/MadaMixBar.jsx';
import { useSettings } from '@src/settings.mjs';
import { useStore } from '@nanostores/react';
import { $project } from '../../game/projectStore.mjs';

// type Props = {
//  context: replcontext,
// }

export default function ReplEditor(Props) {
  const { context, ...editorProps } = Props;
  const { containerRef, editorRef, error, init, pending } = context;
  const settings = useSettings();
  const { panelPosition, isZen } = settings;
  const project = useStore($project);
  const activeDeck = project?.activeDeck === 'B' ? 'B' : 'A';
  const deckClass = activeDeck === 'B' ? 'madamix-deck-b' : 'madamix-deck-a';

  return (
    <div className="h-full flex flex-col relative" {...editorProps}>
      <Loader active={pending} />
      <Header context={context} />
      <div className="grow flex relative overflow-hidden">
        <Code
          containerRef={containerRef}
          editorRef={editorRef}
          init={init}
          deckLabel={`Deck ${activeDeck}`}
          deckClass={deckClass}
        />
        {!isZen && panelPosition === 'right' && <VerticalPanel context={context} />}
      </div>
      {!isZen && <MadaMixBar />}
      <StatusBar codeError={error} />
      {!isZen && panelPosition === 'bottom' && <HorizontalPanel context={context} />}
    </div>
  );
}
