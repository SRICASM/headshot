
import React from 'react';
import CinematicHero from './components/CinematicHero';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        {/* Continuous animation: Frames 0-89 (90 frames total) */}
        <CinematicHero debug={true} />
      </ErrorBoundary>
    </div>
  );
}

export default App;
