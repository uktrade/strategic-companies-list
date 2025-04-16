import pytest
from scl.core.templatetags import scl_html


@pytest.mark.parametrize(
    "val,exp",
    [
        ("    ", '<p class="govuk-body"><br></p>'),
        ("  foo  ", '<p class="govuk-body">foo</p>'),
        ("  <p>Hello, world.</p>  ", "<p>Hello, world.</p>"),
    ],
)
def test_ensure_p(val, exp):
    assert scl_html.ensure_p(val) == exp


@pytest.mark.parametrize(
    "val,exp",
    [
        ("    ", "<li><br></li>"),
        ("  foo  ", "<li>foo</li>"),
        ("  <li>Hello, world.</li>  ", "<li>Hello, world.</li>"),
    ],
)
def test_ensure_li(val, exp):
    assert scl_html.ensure_li(val) == exp
