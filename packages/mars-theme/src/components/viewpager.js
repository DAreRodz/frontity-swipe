import React from "react";
import { connect, styled } from "frontity";
import clamp from "lodash-es/clamp";
import { useSprings, animated, interpolate } from "react-spring";
import { useDrag } from "react-use-gesture";
import Post from "./post";

// Based on https://codesandbox.io/s/v364z
const Viewpager = ({ links, state, actions }) => {
  // Current index (derived from current link).
  const index = links.indexOf(state.router.link);
  // Index of the relative post.
  const [relativeIndex, setRelativeIndex] = React.useState(index);
  // True during swipe.
  const [isSwiping, setIsSwiping] = React.useState(false);

  // Update ref for onRest callback
  const onRestRef = React.useRef(null);

  onRestRef.current = React.useCallback(
    i => {
      if (i === index && isSwiping) {
        setRelativeIndex(index);
        setIsSwiping(false);
        window.scrollTo(0, 0);
      }
    },
    [isSwiping, setRelativeIndex, setIsSwiping, index, relativeIndex]
  );

  // Spring animation for each post.
  const [props, set] = useSprings(links.length, i => ({
    x: i - index,
    deltaX: 0,
    display: "block",
    position: i === relativeIndex ? "relative" : "fixed",
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
    set(i => {
      if (i < index - 1 || i > index + 1) return { display: "none" };
      const x = i - index;
      return {
        x,
        deltaX: 0,
        display: "block",
        position: i === relativeIndex ? "relative" : "fixed"
      };
    });

    if (index !== relativeIndex) setIsSwiping(true);
  }, [index, relativeIndex]);

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
      set(i => {
        if (i < index - 1 || i > index + 1) return { display: "none" };
        const x = i - index;
        return {
          x,
          deltaX,
          display: "block",
          position: i === relativeIndex ? "relative" : "fixed"
        };
      });
    },
    { axis: "x" }
  );

  return (
    <Container>
      {props.map(({ x, deltaX, display, position }, i) => (
        <animated.div
          {...(!isSwiping ? bind() : {})}
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
          {<Post data={state.source.get(links[i])} />}
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
    margin-top: 120px;
    will-change: transform;
    box-sizing: border-box;
  }
`;
