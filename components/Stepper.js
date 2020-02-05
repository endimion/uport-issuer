import Stepper from "react-stepper-horizontal";

const MyStepper = props => {
  return (
    <div>
      <Stepper
        steps={props.steps}
        activeStep={props.activeNum}
        completeTitleColor = {'#00c642'}
        completeColor={'#00c642'}
      />
    </div>
  );
};

export default MyStepper;
