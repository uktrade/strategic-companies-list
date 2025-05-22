import React from "react";
import { useForm } from "react-hook-form";
import Form from "./Form";

const Create = ({ onSubmit, handleCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const props = {
    method: "create",
    onSubmit,
    handleSubmit,
    handleCancel,
    register,
    errors,
  };

  return (
    <>
      <h2 className="govuk-heading-m">Add engagement</h2>
      <Form {...props} />
    </>
  );
};

export default Create;
