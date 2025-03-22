import React from "react";
import Create from "../../forms/engagements/Create";
import LoadingSpinner from "../../components/Spinner";

const AddEngagement = ({
  setIsAddingEngagement,
  onSubmitAddEngagement,
  isLoading,
}) => {
  return (
    <LoadingSpinner isLoading={isLoading}>
      <Create
        onSubmit={onSubmitAddEngagement}
        setIsAddingEngagement={setIsAddingEngagement}
      />
    </LoadingSpinner>
  );
};

export default AddEngagement;
