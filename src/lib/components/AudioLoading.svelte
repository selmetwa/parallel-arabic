<div class="boxContainer">
  <div class="boxContainerInner">
    <div class="box box1"></div>
    <div class="box box2"></div>
    <div class="box box3"></div>
    <div class="box box4"></div>
    <div class="box box5"></div>
  </div>
</div>

<style>
  @keyframes quiet {
    25%{
    transform: scaleY(.6);
  }
  50%{
    transform: scaleY(.4);
  }
  75%{
    transform: scaleY(.8);
  }
}

@keyframes normal {
  25%{
    transform: scaleY(1);
  }
  50%{
    transform: scaleY(.4);
  }
  75%{
    transform: scaleY(.6);
  }
}
@keyframes loud {
  25%{
    transform: scaleY(1);
  }
  50%{
    transform: scaleY(.4);
  }
  75%{
    transform: scaleY(1.2);
  }
}

.boxContainer{
  background-color: var(--tile4);
  border-radius: 50%;
  border: 1px solid var(--tile6);
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  height: 50px;
  width: 50px;
  --boxSize: 3px;
  --gutter: 3px;
}

.boxContainerInner{
  display: flex;
  justify-content: space-between;
  height: 90%;
  margin: 0 auto;
  width: calc((var(--boxSize) + var(--gutter)) * 5);
}

.box{
  transform: scaleY(.4);
  height: 100%;
  width: var(--boxSize);
  background: var(--text3);
  animation-duration: 1.2s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  border-radius: 8px;
}

.box1{
  animation-name: quiet;
}

.box2{
  animation-name: normal;
}

.box3{
  animation-name: quiet;
}

.box4{
  animation-name: loud;
}

.box5{
  animation-name: quiet;
}
</style>
