// frontend/jest.setup.js
import '@testing-library/jest-dom';

Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
	configurable: true,
	value: jest.fn().mockResolvedValue(undefined),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
	configurable: true,
	value: jest.fn(),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
	configurable: true,
	value: jest.fn(),
});