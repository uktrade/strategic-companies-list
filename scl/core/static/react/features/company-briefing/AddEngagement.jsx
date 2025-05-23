import React, { useState, useContext, useEffect } from "react";
import Create from "../../forms/engagements/Create";
import LoadingSpinner from "../../components/Spinner";
import ApiProxy from "../../proxy";

const AddEngagement = ({
  data,
  setIsAddingEngagement,
  setIsEngagementsUpdated,
  setNotification,
  setEngagements,
  csrf_token,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const ENDPOINT = `/api/v1/engagement/${data.duns_number}`;

  const onSubmitAddEngagement = async (payload) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.post(ENDPOINT, payload, csrf_token);
    if (status == 200) {
      setEngagements(data.data);
      setIsLoading(false);
      setIsAddingEngagement(false);
      setNotification({ message: "Engagement added" });
      setIsEngagementsUpdated(true);
    } else {
      setNotification({
        message: `Status ${status}: ${data.message || data.error}`,
        status: "warning",
      });
      setIsEngagementsUpdated(true);
    }
  };
  return (
    <LoadingSpinner isLoading={isLoading}>
      <Create
        onSubmit={onSubmitAddEngagement}
        handleCancel={setIsAddingEngagement}
        data={data}
      />
    </LoadingSpinner>
  );
};

export default AddEngagement;
