
import React, { useState } from 'react';
import CinematicHero from './components/CinematicHero';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';

function App() {
  const [autoPlayDone, setAutoPlayDone] = useState(false);

  return (
    <div className="App">
      <Header show={autoPlayDone} />
      <ErrorBoundary>
        <CinematicHero onAutoPlayComplete={() => setAutoPlayDone(true)} />
      </ErrorBoundary>
    </div>
  );
}

export default App;
