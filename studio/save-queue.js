// Read the current source token inside each operation. A failed save must not block later edits.
export function createSaveQueue(operation) {
  let tail = Promise.resolve();
  return values => {
    const next = tail.then(() => operation(values));
    tail = next.catch(() => undefined);
    return next;
  };
}
