<svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>

<style>
  :root {
    --curve: cubic-bezier(0.650, 0.000, 0.450, 1.000);
  }

.checkmark {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: block;
  stroke-width: 4;
  stroke: var(--text3);
  background-color: var(--tile3);
  stroke-miterlimit: 10;
  flex-shrink: 0;
  box-shadow: inset 0px 0px 0px var(--tile5);
  animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
}

.checkmark__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 4;
  stroke-miterlimit: 10;
  stroke: var(--tile6);
  fill: none;
  animation: stroke .6s var(--curve) forwards;
}

.checkmark__check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke .3s var(--curve) .8s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 30px var(--tile-5);
  }
}
</style>