import React from 'react';
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: boolean }> {
  declare props: { children: React.ReactNode };
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: Error) { console.error('Editor error', error); }
  render() {
    return this.state.error ? <div role="alert" className="p-8">Произошла ошибка редактора. Локальная копия восстанавливается при запуске.
      <button className="border rounded p-2 m-2" onClick={() => location.reload()}>Перезапустить</button></div> : this.props.children;
  }
}
