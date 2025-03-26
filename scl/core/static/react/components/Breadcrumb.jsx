import React from 'react'

const Breadcrumb = ({links}) => {
  return (
    <div className="scl-breadcrumb">
      <nav className="govuk-breadcrumbs" aria-label="Breadcrumb">
        <ol className="govuk-breadcrumbs__list">
          <li className="govuk-breadcrumbs__list-item">
            <a className="govuk-breadcrumbs__link" href="/">
              Home
            </a>
          </li>
          {links.map((link, index)=>{
            return (
              <li
                className="govuk-breadcrumbs__list-item"
                key={`${link.label}-${index}`}
              >
                {link.href ? (
                  <a href={link.href} className="govuk-breadcrumbs__link">
                    {link.label}
                  </a>
                ) : (
                  link.label
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <div>
        <button className="govuk-button govuk-!-margin-bottom-1 govuk-!-margin-right-1" onClick={()=> window.print()}>
          Print
        </button>
        <button className="govuk-button govuk-!-margin-bottom-1">
          Download
        </button>
      </div>
    </div>
  );
}

export default Breadcrumb