import React from "react";
import { useForm } from "react-hook-form";
import Form from "./Form";
import { transformLongDateToShort } from "../../utils";

const Update = ({ onSubmit, data, handleCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: data.title,
      date: transformLongDateToShort(data.date),
      engagementType: data.engagement_type,
      agenda: data.agenda,
      civilServants: data.civil_servants,
      companyRepresentatives: data.company_representatives,
      ministers: data.ministers,
      outcomes: data.outcomes,
      actions: data.actions,
    },
  });

  const props = {
    data,
    method: "update",
    onSubmit,
    handleSubmit,
    handleCancel,
    register,
    errors,
  };

  return (
    <>
      <h2 className="govuk-heading-m">Update: {data.title}</h2>
      <Form {...props} />
    </>
  );
};

export default Update;
