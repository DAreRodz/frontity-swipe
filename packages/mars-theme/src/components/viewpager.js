import React from "react";
import { connect, styled } from "frontity";
import clamp from "lodash-es/clamp";
import { useSprings, animated } from "react-spring";
import { useDrag } from "react-use-gesture";
import Post from "./post";

// Based on https://codesandbox.io/s/v364z
const Viewpager = ({ links, state, actions }) => {
  // Current index (derived from current link).
  const index = links.indexOf(state.router.link);

  // Spring animation for each post.
  const [props, set] = useSprings(links.length, i => ({
    x: i - index,
    display: "block"
  }));

  // Update post positions everytime index changes.
  React.useLayoutEffect(() => {
    set(i => {
      if (i < index - 1 || i > index + 1) return { display: "none" };
      const x = i - index;
      return { x, display: "block" };
    });
  }, [index]);

  // Handler to swipe posts.
  const bind = useDrag(
    ({ canceled, swipe: [swipeX], cancel }) => {
      // Change current link if swipe is detected and drag was not canceled.
      if (swipeX && !canceled) {
        cancel();
        const link = links[clamp(index - swipeX, 0, links.length - 1)];
        actions.router.set(link);
      }
    },
    { axis: "x" }
  );

  return (
    <Container>
      {props.map(({ x, display }, i) => (
        <animated.div
          {...bind()}
          key={links[i]}
          style={{
            display,
            transform: x.interpolate(x => `translate3d(${x * 100}%,0,0)`)
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
  position: fixed;
  top: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  z-index: -1;

  & > div {
    width: 100vw;
    height: 100vh;
    overflow-y: auto;
    will-change: transform;
    position: absolute;
    box-sizing: border-box;
    padding-top: 100px;

    background-color: white;
  }
`;
