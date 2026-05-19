import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app main title', () => {
  render(<App />);
  const titleElement = screen.getByText(/gestion des etablissements/i);
  expect(titleElement).toBeInTheDocument();
});
