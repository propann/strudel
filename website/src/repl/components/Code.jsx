// type Props = {
//   containerRef:  React.MutableRefObject<HTMLElement | null>,
//   editorRef:  React.MutableRefObject<HTMLElement | null>,
//   init: () => void
// }
export function Code(Props) {
  const { editorRef, containerRef, init, deckLabel, deckClass } = Props;

  return (
    <section
      className={'text-gray-100 cursor-text pb-0 overflow-auto grow relative'}
      id="code"
      ref={(el) => {
        containerRef.current = el;
        if (!editorRef.current) {
          init();
        }
      }}
    >
      {deckLabel && (
        <div className={`madamix-editor-badge ${deckClass ?? ''}`}>{deckLabel}</div>
      )}
    </section>
  );
}
