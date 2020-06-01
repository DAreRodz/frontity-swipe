import React from "react";
import { connect, styled } from "frontity";
import clamp from "lodash-es/clamp";
import { useSprings, animated, interpolate } from "react-spring";
import { useDrag } from "react-use-gesture";
import Post from "./post";

const getNewProps = ({ currentIndex, prevIndex, deltaX = 0 }) => (index) =>
  index < currentIndex - 1 || index > currentIndex + 1
    ? { display: "none" }
    : {
        x: index - currentIndex,
        deltaX,
        display: "block",
        position: index === prevIndex ? "relative" : "fixed",
      };

// Based on https://codesandbox.io/s/v364z
const Viewpager = ({ links, state, actions }) => {
  // Current index (derived from current link).
  const currentIndex = links.indexOf(state.router.link);

  // Store the previous index.
  const [prevIndex, setPrevIndex] = React.useState(currentIndex);

  /**
   * Updates `prevIndex` and scroll to the top.
   *
   * This function is executed in the `onRest` callback for each
   * spring element. It needs to be defined this way because it
   * depends on state variables, and thus it needs to be updated,
   * but cannot be assigned directly to the `onRest` callback.
   */
  const updateIndex = React.useRef(null);
  updateIndex.current = React.useCallback(
    (index) => {
      if (index === currentIndex && currentIndex !== prevIndex) {
        setPrevIndex(currentIndex);
        window.scrollTo(0, 0);
      }
    },
    [setPrevIndex, currentIndex, prevIndex]
  );

  // Spring animation for each post.
  const [props, set] = useSprings(links.length, (index) => ({
    x: index - currentIndex,
    deltaX: 0,
    display: "block",
    position: index === prevIndex ? "relative" : "fixed",
    onRest: () => updateIndex.current(index),
  }));

  // Update post positions everytime currentIndex changes.
  React.useLayoutEffect(() => {
    set(getNewProps({ currentIndex, prevIndex }));
  }, [currentIndex, prevIndex]);

  // Handler to swipe posts.
  const bind = useDrag(
    ({ swipe: [swipeX], delta: [deltaX] }) => {
      // Change current link if swipe is detected.
      if (swipeX) {
        // Update current link.
        const link = links[clamp(currentIndex - swipeX, 0, links.length - 1)];
        actions.router.set(link);
      }
      // Update position using deltaX
      set(getNewProps({ currentIndex, prevIndex, deltaX }));
    },
    { axis: "x" }
  );

  return (
    <Container {...bind()}>
      {props.map(({ x, deltaX, display, position }, index) => (
        <animated.div
          key={links[index]}
          style={{
            display,
            position,
            transform: interpolate(
              [x, deltaX],
              (x, deltaX) => `translate3d(calc(${x * 100}% + ${deltaX}px),0,0)`
            ),
          }}
        >
          {/* Render only the previous, current and next posts. */}
          {Math.abs(index - prevIndex) <= 1 && (
            <Post data={state.source.get(links[index])} />
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
