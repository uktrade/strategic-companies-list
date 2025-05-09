import React from "react";
import Select from "react-select";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

import { Controller } from "react-hook-form";

const styles = {
  container: (baseStyles) => ({
    ...baseStyles,
    border: "2px solid #0b0c0c",
    marginBottom: "30px",
  }),
  menuList: (baseStyles) => ({
    ...baseStyles,
    fontFamily: "GDS Transport,arial,sans-serif",
    border: "2px solid #0b0c0c",
  }),
  placeholder: (baseStyles) => ({
    ...baseStyles,
    fontFamily: "GDS Transport,arial,sans-serif",
  }),
  multiValue: (baseStyles) => ({
    ...baseStyles,
    fontFamily: "GDS Transport,arial,sans-serif",
    fontSize: "14px",
  }),
  multiValueLabel: (baseStyles) => ({
    ...baseStyles,
    fontFamily: "GDS Transport,arial,sans-serif",
    fontSize: "14px",
  }),
};

export const MultiSelect = ({ control, data, nonce }) => {
  const cache = createCache({
    key: "scl-multi-select",
    nonce,
  });
  return (
    <CacheProvider value={cache}>
      <Controller
        control={control}
        name="sectors"
        render={({ field }) => (
          <Select
            {...field}
            id={"sectors_select"}
            styles={styles}
            isMulti
            defaultValue={data.company_sectors}
            options={data.all_sectors}
          />
        )}
      />
    </CacheProvider>
  );
};
