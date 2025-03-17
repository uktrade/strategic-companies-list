import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import ApiProxy from "../../proxy";
import LoadingSpinner from "../../components/spinner";

const KeyPeople = ({ id, csrf_token }) => {
  const [data, setData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const onSubmit = (data) => {

  };

  useEffect(() => {
    const fetchData = async () => {
      const { data, status } = await ApiProxy.get(
        `/api/v1/key-people/${id}`,
        csrf_token
      );
      setIsLoading(false);
      setData(data);
    };
    fetchData();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: data.keyPeople,
  });
  return (
    <LoadingSpinner isLoading={isLoading}>
      <div className="scl-insight__header">
        <h2 className="govuk-heading-m">Key People</h2>
        <button
          className="govuk-button scl-content-header__button govuk-!-margin-bottom-2"
          disabled={isEditing}
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>
      </div>
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <label
            className="govuk-label"
            htmlFor="name"
            {...register("name", {
              required: "Name is required",
            })}
          >
            Name
          </label>
          <input
            className="govuk-input govuk-!-margin-bottom-4"
            id="name"
            name="name"
            type="text"
          />
          <label
            className="govuk-label"
            htmlFor="role"
            {...register("role", {
              required: "Role is required",
            })}
          >
            Role
          </label>
          <input
            className="govuk-input govuk-!-margin-bottom-4"
            id="role"
            name="role"
            type="text"
          />
          <div className="govuk-!-margin-top-2">
            <button className="govuk-button govuk-!-margin-right-2">
              Save
            </button>
            <button
              className="govuk-button govuk-button--secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <ul className="govuk-list govuk-list--bullet">
          {!isLoading &&
            data.keyPeople.map((people, index) => (
              <li key={index}>
                {people.role}: {people.name}
              </li>
            ))}
        </ul>
      )}
    </LoadingSpinner>
  );
};

export default KeyPeople;
