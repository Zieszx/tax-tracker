export default function Button({ variant = 'gold', className = '', ...rest }) {
  return <button className={`btn btn-${variant} ${className}`} {...rest} />
}
