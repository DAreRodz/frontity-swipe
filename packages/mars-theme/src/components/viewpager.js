import React from "react";
import { connect, styled } from "frontity";
import clamp from "lodash-es/clamp";
import { useSprings, animated, interpolate } from "react-spring";
import { useDrag } from "react-use-gesture";
import Post from "./post";

const getNewProps = ({ index, prevIndex, deltaX = 0 }) => i =>
  i < index - 1 || i > index + 1
    ? { display: "none" }
    : {
        x: i - index,
        deltaX,
        display: "block",
        position: i === prevIndex ? "relative" : "fixed"
      };

// Based on https://codesandbox.io/s/v364z
const Viewpager = ({ links, state, actions }) => {
  // Current index (derived from current link).
  const index = links.indexOf(state.router.link);
  const [prevIndex, setPrevIndex] = React.useState(index);

  // Update ref for onRest callback
  const onRestRef = React.useRef(null);
  onRestRef.current = React.useCallback(
    i => {
      if (i === index && index !== prevIndex) {
        setPrevIndex(index);
        window.scrollTo(0, 0);
      }
    },
    [setPrevIndex, index, prevIndex]
  );

  // Spring animation for each post.
  const [props, set] = useSprings(links.length, i => ({
    x: i - index,
    deltaX: 0,
    display: "block",
    position: i === prevIndex ? "relative" : "fixed",
    config: {
      clamp: true,
      friction: 40,
      tension: 500
    },
    onRest: () => {
      onRestRef.current(i);
    }
  }));

  // Update post positions everytime index changes.
  React.useLayoutEffect(() => {
    set(getNewProps({ index, prevIndex }));
  }, [index, prevIndex]);

  // Handler to swipe posts.
  const bind = useDrag(
    ({ canceled, swipe: [swipeX], delta: [deltaX], cancel }) => {
      // Change current link if swipe is detected and drag was not canceled.
      if (swipeX && !canceled) {
        cancel();
        const link = links[clamp(index - swipeX, 0, links.length - 1)];
        actions.router.set(link);
      }
      // Update position using deltaX
      set(getNewProps({ index, prevIndex, deltaX }));
    },
    { axis: "x" }
  );

  return (
    <Container>
      {props.map(({ x, deltaX, display, position }, i) => (
        <animated.div
          {...(index === prevIndex ? bind() : {})}
          key={links[i]}
          style={{
            display,
            position,
            transform: interpolate(
              [x, deltaX],
              (x, deltaX) => `translate3d(calc(${x * 100}% + ${deltaX}px),0,0)`
            )
          }}
        >
          {/* Render only the previous, current and next posts. */}
          {!(i < prevIndex - 1 || i > prevIndex + 1) && (
            <Post data={state.source.get(links[i])} />
          )}
        </animated.div>
      ))}
    </Container>
  );
};

export default connect(Viewpager);

const Container = styled.div`
  position: relative;
  top: 0;
  width: 100vw;
  overflow-x: hidden;

  & > div {
    top: 0;
    left: 0;
    width: 100%;
    will-change: transform;
    box-sizing: border-box;
  }
`;
