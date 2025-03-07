from django import forms


class EngagementForm(forms.Form):
    title = forms.CharField(label="Title", max_length=128,
                            required=True, error_messages={"invalid": "Title is required"})
    date = forms.DateField(label="Date", widget=forms.DateInput(
        attrs={'type': 'date'}), input_formats=["%Y-%m-%d"], required=True, error_messages={"invalid": "Date is required"})
    details = forms.CharField(
        label="Details", widget=forms.Textarea(attrs={"rows": 5, "cols": 40}), required=True, error_messages={"invalid": "Details are required"})
